const express = require('express');
const bodyParser = require('body-parser');
const OpenAIApi = require("openai");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const app = express();
const helpers = require("./helpers.js");
const config = require('./config.js');
const sessionMgmt = require('./sessionManagement.js');

// Helper function to get SessionManager instance for a session
function getSessionManager(session) {
    return new sessionMgmt.SessionManager(session)
}

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'pug');
app.use('/static', express.static('static'));


// Initialization
app.use(cookieParser());

const sessionSecret = config.sessionSecret;

app.use(session({
    secret: sessionSecret,
    saveUninitialized: true,
    resave: true
}));

const maxUID = 100000;

// Form type constants for unified POST handler
const POST_RESPONSE_TYPES = {
    WELCOME_CODE: 'welcome_code',
    CONSENT: 'consent',
    PRE_QUESTIONNAIRE: 'pre_questionnaire',
    CHAT_ENDED: 'chat_ended',
    POST_QUESTIONNAIRE: 'post_questionnaire'
};

const openai = config.apiKey ? new OpenAIApi({
    apiKey: config.apiKey
}) : null;

// use whatever llm model you want here
async function getLLMResponse(conversation) {
    if (!config.apiKey) {
        if (!config.fakeLlmResponse) {
            throw new Error('Missing LLM configuration: set OPENAI_API_KEY for real responses or FAKE_LLM_RESPONSE for local testing.');
        }
        return config.fakeLlmResponse;
    }

    const chatCompletion = await openai.chat.completions.create({
        messages: conversation,
        model: config.apiModel,
        max_tokens: config.apiTokenLimit,
        temperature: 0.7
    });
    return chatCompletion.choices[0].message.content;
}

// Middleware to ensure system is properly initialized
function verifySystemInitialized(req, res, next) {
    helpers.waitForSystemInitializiation()
        .then(() => next())
        .catch(err => {
            console.error('System initialization failed:', err);
            res.status(500).json({ error: 'System initialization failed' });
        });
}

// Middleware to initialize user session with default values
function verifySession(req, res, next) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.isInitialized()) {
        // Generate uid and treatmentGroupId first since they're interdependent
        const uidNumber = helpers.getRandomInt(0, maxUID);
        const uid = uidNumber.toString();
        const treatmentGroupId = helpers.getTreatmentGroupId(uidNumber);
        
        // Extract Prolific parameters from query string
        const prolificUid = {};
        Object.keys(req.query).forEach(key => {
            const keyLower = key.toLowerCase();
            if (["prolific_pid", "study_id", "session_id"].includes(keyLower)) {
                prolificUid[key] = req.query[key];
            }
        });
        
        // Initialize session first with basic values
        sessionManager.initialize(uid, treatmentGroupId, prolificUid);
        
        // Now set user preferences based on treatment group (after session is initialized)
        sessionManager.setPreferences(helpers.getUserPreferences(req));
        
        console.log(`New session created - UID: ${sessionManager.getUid()}, Treatment Group: ${sessionManager.getTreatmentGroupId()}, Prolific: ${JSON.stringify(sessionManager.getProlificUid())}`);
    }
    next();
}

// Middlewares to be executed for every GET request to the app, making sure the session is initialized with code.
async function renderSessionCode(req, res, next) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getCode()) {
        let renderParams = helpers.getRenderingParamsForPage("welcome_code");
        renderParams["form_type"] = POST_RESPONSE_TYPES.WELCOME_CODE;
        res.render('./welcome_code', renderParams);
        return;
    }
    next();
};

// Middlewares to be executed for every GET request to the app, making sure the session is initialized with user consent.
function renderUserConsent(req, res, next) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getConsent()) {
        let renderParams = helpers.getRenderingParamsForPage("consent");
        renderParams["form_type"] = POST_RESPONSE_TYPES.CONSENT;
        res.render('./consent', renderParams);
        return;
    }
    next();
};

// Middlewares to be executed for every GET request to the app, making sure the pre questions are answered (if any).
function renderPreQuestionnaire(req, res, next) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getPreQuestionsAnswers()) {
        let preQuestions = helpers.getUserTestQuestions(req, "user_pre_questions");
        if (preQuestions.length > 0) {
            let renderParams = helpers.getRenderingParamsForPage("pre_questionnaire");
            renderParams["questions"] = preQuestions;
            renderParams["form_type"] = POST_RESPONSE_TYPES.PRE_QUESTIONNAIRE;
            renderParams["form_submit_botton_text"] = 'Next';
            
            res.render('./user_questionnaire', renderParams);
        }
        else {
            sessionManager.setPreQuestionsAnswers({});
            res.redirect(302, "/");
        }
        return;
    }
    next();
};

// Middlewares to be executed for every GET request to the app, making sure the chat page is displayed.
function renderChat(req, res, next) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getChatEnded()) {
        helpers.setSelectedHiddenPromptToSession(req);
        
        // support emptry hidden prompt - this allows for skipping the chat part
        if (!sessionManager.getSystemRoleHiddenContent()) {
            sessionManager.setChatEnded(true);
        } else {
            let renderParams = helpers.getRenderingParamsForPage("chat");
            renderParams["preferences"] = sessionManager.getPreferences();
            renderParams["task_description"] = helpers.getUserTaskDescription(req);
            renderParams["form_type"] = POST_RESPONSE_TYPES.CHAT_ENDED;
            res.render('./chat', renderParams);
        }
        return;
    }
    next();
};

// Middlewares to be executed for every GET request to the app, making sure the user questionnaire is rendered.
function renderChatQuestionnaire(req, res, next) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getQuestionsAnswers()) {
        let renderParams = helpers.getRenderingParamsForPage("post_questionnaire");
        renderParams["questions"] = helpers.getUserTestQuestions(req, "user_post_questions");
        renderParams["form_type"] = POST_RESPONSE_TYPES.POST_QUESTIONNAIRE;
        renderParams["form_submit_botton_text"] = 'Submit';
            
        res.render('./user_questionnaire', renderParams);
        return;
    }
    next();
};

// POST response type handlers

/**
 * Handles welcome code submission and validation
 * Validates the provided code and manages Prolific participant ID reconciliation
 */
async function handleWelcomeCodeSubmission(req, res) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getCode()) {
        const isCodeValid = await helpers.isCodeValid(req.body["code"]);
        if (isCodeValid) {
            sessionManager.setCode(req.body["code"]);
            const prolificUid = sessionManager.getProlificUid();
            if (prolificUid["prolific_pid"] !== req.body["prolificPID"]) {
                if (!prolificUid["prolific_pid"]){
                    prolificUid["prolific_pid"] = req.body["prolificPID"];
                    sessionManager.setProlificUid(prolificUid);
                    console.log("notice. session. uid: " + sessionManager.getUid() + ", updated prolific_pid: " + prolificUid["prolific_pid"]);
                }
                if (prolificUid["prolific_pid"] !== req.body["prolificPID"]) { 
                    prolificUid["user_reported_prolific_pid"] = req.body["prolificPID"];
                    sessionManager.setProlificUid(prolificUid);
                    console.log("notice: user_reported_prolific_pid: " + prolificUid["user_reported_prolific_pid"] + " differs from prolific_pid: " + prolificUid["prolific_pid"]);
                }
            }
        }
    }
}

/**
 * Handles consent form submission
 * Processes consent responses and terminates session if user declines
 * Returns false if session terminated, true to continue normal flow
 */
function handleConsentSubmission(req, res) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getConsent()) {
        let declined = false;
        Object.keys(req.body).forEach(key => {
            if (key.startsWith("consent.")) {
                if (req.body[key] !== "YES") {
                    declined = true;
                }
            }
        });
        if (declined) {
            sessionManager.setFinished(true);
            sessionManager.setSessionEndedHeaderOverride("Thank You,");
            sessionManager.setSessionEndedBodyOverride("You opted out");
        }
        else {
            sessionManager.setConsent(true);
        }
    }
}

/**
 * Handles pre-questionnaire submission
 * Saves participant responses to pre-experiment questions
 */
function handlePreQuestionnaireSubmission(req, res) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getPreQuestionsAnswers()) {
        sessionManager.setPreQuestionsAnswers(req.body);
    }
}

/**
 * Handles chat completion notification
 * Sets flag indicating participant has finished the chat interaction
 */
function handleChatEndedSubmission(req, res) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getChatEnded()) {
        sessionManager.setChatEnded(true);
    }
}

/**
 * Handles post-questionnaire submission and experiment completion
 */
async function handlePostQuestionnaireSubmission(req, res) {
    const sessionManager = getSessionManager(req.session);
    if (!sessionManager.getQuestionsAnswers()) {
        sessionManager.setFinished(true);
        sessionManager.setRedirectUrl(config.redirect_url);
        if (config.complete_code) {
            sessionManager.setCompletionCode(config.complete_code);
        } else if (config.generateUniqueCompletionCode) {
            sessionManager.setCompletionCode(helpers.generateUniqueCompletionCode());
        }
        sessionManager.setUserQuestionnaireEndedTime(new Date().toISOString());
        sessionManager.setQuestionsAnswers(req.body);
    }
}

// Unified POST handler for all form submissions
app.post('/submit_user_response', async (req, res) => {
    const formType = req.body.form_type;
    
    switch (formType) {
        case POST_RESPONSE_TYPES.WELCOME_CODE:
            await handleWelcomeCodeSubmission(req, res);
            break;
            
        case POST_RESPONSE_TYPES.CONSENT:
            handleConsentSubmission(req, res);
            break;
            
        case POST_RESPONSE_TYPES.PRE_QUESTIONNAIRE:
            handlePreQuestionnaireSubmission(req, res);
            break;
            
        case POST_RESPONSE_TYPES.CHAT_ENDED:
            handleChatEndedSubmission(req, res);
            break;
            
        case POST_RESPONSE_TYPES.POST_QUESTIONNAIRE:
            await handlePostQuestionnaireSubmission(req, res);
            break;
            
        default:
            console.log('Unknown form type:', formType);
    }
    
    // Redirect back to root to let GET middleware chain determine next step
    res.redirect(302, "/");
});

// the main chat route.
// each part of the conversation is stored in the session
// the conversation context is sent to the openai chat api
// response is sent back to the client
app.post('/chat-api', async (req, res) => {
    const sessionManager = getSessionManager(req.session);
    const message = req.body.message;
    sessionManager.addToConversationContext({ role: 'user', content: message, interactionTime: sessionManager.getAndResetInteractionTime() });
    const messageWithContext = helpers.createFullConversationPrompt(req);
    try {
        const apiReply = await getLLMResponse(messageWithContext);
        sessionManager.addToConversationContext({ role: 'assistant', content: apiReply, interactionTime: sessionManager.getAndResetInteractionTime() });
        res.send(apiReply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// user has completed the experiment.
async function handleUserCompleted(req, res) {
    const sessionManager = getSessionManager(req.session);
    const savedResultsObj = helpers.saveSessionResults(req);
    await helpers.setCodeCompleted(sessionManager.getCode(), {time: new Date().toISOString(), uid: sessionManager.getUid(), completionCode: sessionManager.getCompletionCode()});
    sessionManager.destroy();
    console.log("Session ended. uid: " + savedResultsObj.uid);
}

// Middlewares to be executed for every request to the app, making sure the session has not already finished.
// Finalizes session, saves responses, displays completion page with codes
function verifySessionEnded(req, res, next) {
    const sessionManager = getSessionManager(req.session);
    if (sessionManager.getFinished()) {
        let renderParams = helpers.getRenderingParamsForPage("session_ended");
        
        // Set custom header and body messages if provided
        const headerOverride = sessionManager.getSessionEndedHeaderOverride();
        if (headerOverride) {
            renderParams["header_message"] = headerOverride;
        }
        const bodyOverride = sessionManager.getSessionEndedBodyOverride();
        if (bodyOverride) {
            renderParams["body_message"] = bodyOverride;
        }
        else {
            const redirectUrl = sessionManager.getRedirectUrl();
            if (redirectUrl) {
                renderParams["body_message"] = "Click the 'Next' button to proceed.";
            } else {
                renderParams["body_message"] = "You may now close this window.";
            }   
        }
        
        // Set completion and redirect info if available
        const completionCode = sessionManager.getCompletionCode();
        if (completionCode) {
            renderParams["completion_code"] = completionCode;
        }
        const redirectUrl = sessionManager.getRedirectUrl();
        if (redirectUrl){
            renderParams["redirect_url"] = redirectUrl;
        }
        
        res.render('./session_ended', renderParams);
        
        // Only handle user completion if consent was given, not for consent decline
        if (sessionManager.getConsent()) {
            handleUserCompleted(req, res).then(() => {}).catch((err) => {
                console.error('Error handling user completion:', err);
            });
        } else {
            // For consent decline, just destroy session without saving results
            sessionManager.destroy();
            console.log("Session terminated due to consent decline");
        }
        return;
    }
    next();
};


app.use([
    verifySystemInitialized, 
    verifySession, 
    verifySessionEnded, 
]);

// The flow of the app is defined here.
app.get('/', [
    renderSessionCode,
    renderUserConsent,
    renderPreQuestionnaire,
    renderChat,
    renderChatQuestionnaire
]);


const port = process.env.PORT || 3030;
app.listen(port, () => console.log(`Server running on port ${port}`));
