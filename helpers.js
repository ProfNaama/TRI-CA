const csv = require('csv-parser')
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const { Pool } = require('pg');
const sessionMgmt = require('./sessionManagement.js');

// Helper function to get SessionManager instance for a session
function getSessionManager(session) {
    return new sessionMgmt.SessionManager(session)
}

const csvBasePath = "experiment_configuration/";
const csvDB = {};

let treatmentFroupConfigRecords;
let userQuestionnaireRecords;
let experimentDescRecords;
let treatmentGroups;

// read the csv files and store them in the csvDB
// we use async createReadStream to parse records
// se we wrap it in promise and wait for all of them to finish
async function readAllCsvFiles() {
    await Promise.all(
        fs.readdirSync(csvBasePath).filter(fileName => fileName.endsWith(".csv")).map(fileName => {
            let records = [];
            return new Promise((resolve, reject) => {
                fs.createReadStream(path.join(csvBasePath, fileName))
                .pipe(csv())
                .on('data', (data) => { 
                    if (Object.keys(data).length > 0) {
                        records.push(data)
                    }
                })
                .on('end', () => {
                    csvDB[fileName] = records;
                    resolve()
                });
            });
        })
    );
    treatmentFroupConfigRecords = csvDB["treatment_groups_config.csv"];
    userQuestionnaireRecords = csvDB["questions_bank.csv"];
    experimentDescRecords = csvDB["experiment_desc.csv"];
    treatmentGroups = Array.from(new Set(treatmentFroupConfigRecords.map(r => parseInt(r["treatment_group"]))));
}

let hiddenPromptsBank = {}
let userTasksBank = {}

async function loadFileBank(subdirectory, targetObject) {
    const bankBasePath = path.join(csvBasePath, subdirectory);
    await Promise.all(
        fs.readdirSync(bankBasePath).map(fileName => {
            return new Promise((resolve, reject) => {
                fs.readFile(path.join(bankBasePath, fileName), 'utf8', (err, data) => {
                    targetObject[fileName] = data;
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        })
    );        
}

const avatgarsPath = 'static/images/avatars/';
function getAvatarImageFullPath(imageName) {
    return path.join(avatgarsPath, imageName);
}

let isSystemInitialized = false;

async function waitForSystemInitializiation() {
    if (isSystemInitialized) {
        return; // Already initialized, nothing to do
    }
    
    await readAllCsvFiles();
    await loadFileBank("hidden_prompts_bank", hiddenPromptsBank);
    await loadFileBank("user_tasks_bank", userTasksBank);
    
    isSystemInitialized = true;
    console.log('System initialization completed successfully');
}

function getTreatmentGroupId(uid) { 
    return treatmentGroups[(uid % treatmentGroups.length)];
}

// notice that in case we want to reproduce random numbers, we could add the flag --random_seed=42 (or whatever number) to the node command.
function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function getRenderingParamsForPage(page) {
    const pageRecord = experimentDescRecords.find(record => record["page"] === page);
    return {
        title: pageRecord?.["title"] || "", 
        header_message: pageRecord?.["header"] || "", 
        body_message: pageRecord?.["body1"] || ""
    };
}

function getSelectedPrompt(req) {
    const sessionManager = getSessionManager(req.session);
    const treatmentGroupRecord = treatmentFroupConfigRecords.find(r => 
        parseInt(r["treatment_group"]) === sessionManager.getTreatmentGroupId()
    );
    const hiddenPromptFile = treatmentGroupRecord?.["hidden_prompt"];
    return hiddenPromptFile ? hiddenPromptsBank[hiddenPromptFile] : null;
}

function setSelectedHiddenPromptToSession(req) {
    const sessionManager = getSessionManager(req.session);
    sessionManager.setSystemRoleHiddenContent(getSelectedPrompt(req));
}


// Fisher-Yates shuffle algorithm for randomizing arrays
function shuffleArray(array) {
    const shuffled = [...array]; // Create a copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function groupLikertQuestions(questions) {
    let groupedQuestions = [];
    questions.forEach(function(q) {
        if (!q["is_grouped_likert"]) {
            groupedQuestions.push(q);
            return;
        }
        
        // adding "key" property for ease of grouping
        q["key"] = q["choices"][0] + ";" + q["choices"][1];
        if (groupedQuestions.length == 0 || groupedQuestions[groupedQuestions.length - 1]["key"] != q["key"]) {
            // first on its group - create an array of labels for the group
            q["grouped_questions"] = [];
            groupedQuestions.push(q);
        } 
        groupedQuestions[groupedQuestions.length - 1]["grouped_questions"].push({label: q["label"], name: q["name"]});
    });
    return groupedQuestions;
};
    
function getUserTestQuestions(req, csv_header) {
    const sessionManager = getSessionManager(req.session);
    const treatmentGroupRecord = treatmentFroupConfigRecords.find(r => 
        parseInt(r["treatment_group"]) === sessionManager.getTreatmentGroupId()
    );
    const treatmentGroupBlocks = treatmentGroupRecord?.[csv_header]?.split(";").map(b => b.trim()) || [];
    
    // Helper function to parse boolean values from CSV
    const parseBoolean = (value) => value?.trim() === "1";
    
    // Group questions by block and collect them with randomization settings
    let blocks = new Map();

    treatmentGroupBlocks.forEach(blockName => { 
        userQuestionnaireRecords
            .filter(record => record["block_name"] === blockName)
            .forEach(record => { 
                const questionObj = {
                    "name": record["question_name"],
                    "label": record["question_text"]?.trim() || null,
                    "is_text": parseBoolean(record["is_text"]),
                    "is_likert": parseBoolean(record["is_likert"]),
                    "is_grouped_likert": parseBoolean(record["is_grouped_likert"]),
                    "is_multi_choice": parseBoolean(record["is_multi_choice"]), 
                    "is_label": parseBoolean(record["is_label"]), 
                    "choices": record["options"]?.split("|").map(o => o.trim()) || []
                };

                // Get block information
                const allowBlockPermutation = parseBoolean(record["allow_block_permutation"]);
                const allowQuestionPermutation = parseBoolean(record["allow_question_permutation"]);

                if (!blocks.has(blockName)) {
                    blocks.set(blockName, {
                        name: blockName,
                        allowBlockPermutation: allowBlockPermutation,
                        allowQuestionPermutation: allowQuestionPermutation,
                        questions: []
                    });
                }
                
                blocks.get(blockName).questions.push(questionObj);
            });
    });

    // Convert blocks to array and process randomization
    let blockArray = Array.from(blocks.values());
    let questions = []; // Array to collect all questions from all blocks
    
    // Block randomization: preserve positions of non-randomizable blocks
    // and randomize only the randomizable blocks among themselves
    const randomizableBlocks = [];
    const randomizableIndices = [];
    
    // Identify which blocks can be randomized and their positions
    blockArray.forEach((block, index) => {
        if (block.allowBlockPermutation) {
            randomizableBlocks.push(block);
            randomizableIndices.push(index);
        }
    });
    
    // If there are randomizable blocks, shuffle them and put them back
    if (randomizableBlocks.length > 1) {
        const shuffledRandomizableBlocks = shuffleArray(randomizableBlocks);
        randomizableIndices.forEach((originalIndex, i) => {
            blockArray[originalIndex] = shuffledRandomizableBlocks[i];
        });
    }

    // Randomize questions within each block if allowed
    blockArray.forEach(block => {
        if (block.allowQuestionPermutation) {
            // Separate label questions from regular questions
            const labelQuestions = block.questions.filter(q => q.is_label);
            const nonLabelQuestions = block.questions.filter(q => !q.is_label);
            
            // Assert that there's at most 1 label question per block
            if (labelQuestions.length > 1) {
                console.error(`Block ${block.name} has ${labelQuestions.length} label questions. Maximum 1 allowed.`);
                throw new Error(`Block ${block.name} has multiple label questions`);
            }
            
            // Shuffle only the non-label questions
            const shuffledNonLabelQuestions = shuffleArray(nonLabelQuestions);
            
            // Combine: label questions first, then shuffled non-label questions
            block.questions = [...labelQuestions, ...shuffledNonLabelQuestions];
        }
        // Add all questions from this block to the final questions array
        questions.push(...block.questions);
    });

    return groupLikertQuestions(questions);
}

function getUserTaskDescription(req) {
    const sessionManager = getSessionManager(req.session);
    const treatmentGroupRecord = treatmentFroupConfigRecords.find(r => 
        parseInt(r["treatment_group"]) === sessionManager.getTreatmentGroupId()
    );
    const filename = treatmentGroupRecord?.["user_task_description"];
    return filename ? userTasksBank[filename] : "";
}

function getUserPreferences(req) {
    const sessionManager = getSessionManager(req.session);
    const treatmentGroupRecord = treatmentFroupConfigRecords.find(r => 
        parseInt(r["treatment_group"]) === sessionManager.getTreatmentGroupId()
    );
    
    return {
        "user_name": treatmentGroupRecord?.["user_name"] || "",
        "user_avatar": getAvatarImageFullPath(treatmentGroupRecord?.["user_avatar"] || ""),
        "agent_name": treatmentGroupRecord?.["agent_name"] || "",
        "agent_avatar": getAvatarImageFullPath(treatmentGroupRecord?.["agent_avatar"] || "")
    };
}

function createFullConversationPrompt(req) {
    const sessionManager = getSessionManager(req.session);
    let conversationSystemRole = {"role": "system", "content": sessionManager.getSystemRoleHiddenContent()}; 
    const conversation = sessionManager.getConversationContext().map(c => ({role: c.role, content: c.content}));
    const messageWithContext = [conversationSystemRole].concat(conversation);

    return messageWithContext;
}

function saveSessionResults(req) {
    const sessionManager = getSessionManager(req.session);
    let sessionText = JSON.stringify(sessionManager.toJsonObject());
    if (config.encodeBase64){
        sessionText = Buffer.from(sessionText).toString('base64');
    }
    const sessionResultObj = {time: new Date(), uid: sessionManager.getUid(), userid: sessionManager.getUserid(), data: sessionText };
    
    if (config.resultsFile){
        fs.appendFileSync(config.resultsFile, JSON.stringify(sessionResultObj) + "\n", { flush: true } );
    }
    
    if (config.connectionString) {
        // use pg to insert results to the database table
        const pool = new Pool({
            connectionString: config.connectionString,
            ssl: { rejectUnauthorized: false },
        }); 
        
        const query = {
            text: 'INSERT INTO ' + config.resultsTable + ' (uuid, expid, userid, result) VALUES ($1, $2, $3, $4)',
            values: [sessionResultObj.uid, config.experimentId, sessionResultObj.userid, sessionResultObj]
        }
    
        pool.query(query, (error) => {
            if (error) {
                console.log("Error: " + error);
            }
            pool.end();
        });
    }
    return sessionResultObj;
}

async function isCodeValid(code) {
    if (code) {
        if (config.reusableCode && (code === config.reusableCode)) {
            return true;
        }

        if (config.connectionString) {
            const pool = new Pool({
                connectionString: config.connectionString,
                ssl: { rejectUnauthorized: false },
            }); 
            
            const query = {
                text: 'SELECT completed FROM ' + config.codesTable + ' WHERE code = $1 and expid = $2',
                values: [code, config.experimentId]
            }
        
            const result = await new Promise((resolve, reject) => {
                pool.query(query, (error, result) => {
                    pool.end();
                    if (error) {
                        console.log("Error: " + error);
                        resolve(false);
                    }
                    resolve(result);
                });
            });
            return result && result.rows && result.rows[0] && !result.rows[0].completed;
        }
    }
    return false;
}

async function setCodeCompleted(code, obj) {
    if (config.reusableCode && (code === config.reusableCode)) {
        return true;
    }

    if (config.connectionString) {
        const pool = new Pool({
            connectionString: config.connectionString,
            ssl: { rejectUnauthorized: false },
        }); 
        
        const query = {
            text: 'UPDATE ' + config.codesTable + ' SET completed = $3 WHERE code = $1 and expid = $2',
            values: [code, config.experimentId, obj]
        }
    
        const result = await new Promise((resolve, reject) => {
            pool.query(query, (error, result) => {
                pool.end();
                if (error) {
                    console.log("Error: " + error);
                    resolve(false);
                }
                resolve(result);
            });
        });
        return result;
    }
}

module.exports = {
    waitForSystemInitializiation,
    getTreatmentGroupId,
    getRandomInt,
    createFullConversationPrompt,
    setSelectedHiddenPromptToSession,
    saveSessionResults,
    isCodeValid,
    setCodeCompleted,
    getRenderingParamsForPage,
    getUserTaskDescription,
    getUserPreferences,
    getUserTestQuestions
}