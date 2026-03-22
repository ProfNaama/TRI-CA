/**
 * Session Management Class
 * Provides a clean interface for managing session properties
 */

class SessionManager {
    constructor(session) {
        if (!session) {
            throw new Error('Session object is required');
        }
        this.session = session;
    }

    // Check if session is initialized
    isInitialized() {
        return this.session && this.session._uid !== undefined;
    }

    // Throw error if not initialized
    _throwIfNotInitialized() {
        if (!this.isInitialized()) {
            throw new Error('Session not initialized. Call initialize() first.');
        }
    }

    // Auto-save helper
    _save() {
        this.session.save();
    }

    // Initialize session with all required fields
    initialize(uid, treatmentGroupId, prolificUid) {
        // Set all session properties directly to avoid multiple saves
        this.session._uid = uid;
        this.session._treatmentGroupId = treatmentGroupId;
        this.session._prolificUid = prolificUid;
        this.session._systemRoleHiddenContent = null;
        this.session._conversationContext = [];
        this.session._lastInteractionTime = null;
        this.session._user_questionnaire_ended = null;
        this.session._questionsAnswers = null;
        this.session._prequestionsAnswers = null;
        this.session._chat_ended = false;
        this.session._code = null;
        this.session._completionCode = null;
        this.session._consent = false;
        this.session._finished = false;
        this.session._sessionEndedHeaderOverride = null;
        this.session._sessionEndedBodyOverride = null;
        this.session._sessionStartTime = new Date().toISOString();
        this.session._preferences = null;
        this.session._redirectUrl = null;
        
        // Save once at the end
        this._save();
    }

    // Destroy session
    destroy() {
        this._throwIfNotInitialized();
        this.session.destroy();
    }

    // Convert session to JSON object
    toJsonObject() {
        this._throwIfNotInitialized();
        return {
            "uid": this.session._uid,
            "sessionStartTime": this.session._sessionStartTime,
            "userQuestionnaireEndedTime": this.session._user_questionnaire_ended,
            "prolificUid": this.session._prolificUid,
            "code": this.session._code,
            "treatmentGroupId": this.session._treatmentGroupId,
            "preferences": this.session._preferences,
            "systemRoleHiddenContent": this.session._systemRoleHiddenContent,
            "conversationContext": this.session._conversationContext,
            "postQuestionsAnswers": this.session._questionsAnswers,
            "preQuestionsAnswers": this.session._prequestionsAnswers,
            "completionCode": this.session._completionCode,
            "completionRedirectUrl": this.session._redirectUrl,
            "sessionEndedHeaderOverride": this.session._sessionEndedHeaderOverride,
            "sessionEndedBodyOverride": this.session._sessionEndedBodyOverride,
            "lastInteractionTime": this.session._lastInteractionTime,
            "chatEnded": this.session._chat_ended,
            "finished": this.session._finished,
            "consent": this.session._consent,
            "userid": this.getUserid()
        };
    }

    // Getters
    getUid() {
        this._throwIfNotInitialized();
        return this.session._uid;
    }

    getSessionStartTime() {
        this._throwIfNotInitialized();
        return this.session._sessionStartTime;
    }

    getConsent() {
        this._throwIfNotInitialized();
        return this.session._consent;
    }

    getCode() {
        this._throwIfNotInitialized();
        return this.session._code;
    }

    getTreatmentGroupId() {
        this._throwIfNotInitialized();
        return this.session._treatmentGroupId;
    }

    getPreferences() {
        this._throwIfNotInitialized();
        return this.session._preferences;
    }

    getSystemRoleHiddenContent() {
        this._throwIfNotInitialized();
        return this.session._systemRoleHiddenContent;
    }

    getConversationContext() {
        this._throwIfNotInitialized();
        return this.session._conversationContext;
    }

    getQuestionsAnswers() {
        this._throwIfNotInitialized();
        return this.session._questionsAnswers;
    }

    getPreQuestionsAnswers() {
        this._throwIfNotInitialized();
        return this.session._prequestionsAnswers;
    }

    getCompletionCode() {
        this._throwIfNotInitialized();
        return this.session._completionCode;
    }

    getRedirectUrl() {
        this._throwIfNotInitialized();
        return this.session._redirectUrl;
    }

    getSessionEndedHeaderOverride() {
        this._throwIfNotInitialized();
        return this.session._sessionEndedHeaderOverride;
    }

    getSessionEndedBodyOverride() {
        this._throwIfNotInitialized();
        return this.session._sessionEndedBodyOverride;
    }

    getLastInteractionTime() {
        this._throwIfNotInitialized();
        return this.session._lastInteractionTime;
    }

    getUserQuestionnaireEndedTime() {
        this._throwIfNotInitialized();
        return this.session._user_questionnaire_ended;
    }

    getProlificUid() {
        this._throwIfNotInitialized();
        return this.session._prolificUid;
    }

    getChatEnded() {
        this._throwIfNotInitialized();
        return this.session._chat_ended;
    }

    getFinished() {
        this._throwIfNotInitialized();
        return this.session._finished;
    }

    getUserid() {
        this._throwIfNotInitialized();
        // Check if prolificUid exists and is not an empty object
        if (this.session._prolificUid && typeof this.session._prolificUid === 'object' && Object.keys(this.session._prolificUid).length > 0) {
            return this.session._prolificUid;
        }
        return this.session._uid;
    }

    // Setters
    setUid(uid) {
        this._throwIfNotInitialized();
        this.session._uid = uid;
        this._save();
    }

    setSessionStartTime(startTime) {
        this._throwIfNotInitialized();
        this.session._sessionStartTime = startTime;
        this._save();
    }

    setConsent(consent) {
        this._throwIfNotInitialized();
        this.session._consent = consent;
        this._save();
    }

    setCode(code) {
        this._throwIfNotInitialized();
        this.session._code = code;
        this._save();
    }

    setTreatmentGroupId(treatmentGroupId) {
        this._throwIfNotInitialized();
        this.session._treatmentGroupId = treatmentGroupId;
        this._save();
    }

    setPreferences(preferences) {
        this._throwIfNotInitialized();
        this.session._preferences = preferences;
        this._save();
    }

    setSystemRoleHiddenContent(content) {
        this._throwIfNotInitialized();
        this.session._systemRoleHiddenContent = content;
        this._save();
    }

    setConversationContext(context) {
        this._throwIfNotInitialized();
        this.session._conversationContext = context;
        this._save();
    }

    addToConversationContext(message) {
        this._throwIfNotInitialized();
        if (!this.session._conversationContext) {
            this.session._conversationContext = [];
        }
        this.session._conversationContext.push(message);
        this._save();
    }

    setQuestionsAnswers(answers) {
        this._throwIfNotInitialized();
        this.session._questionsAnswers = answers;
        this._save();
    }

    setPreQuestionsAnswers(answers) {
        this._throwIfNotInitialized();
        this.session._prequestionsAnswers = answers;
        this._save();
    }

    setCompletionCode(code) {
        this._throwIfNotInitialized();
        this.session._completionCode = code;
        this._save();
    }

    setRedirectUrl(url) {
        this._throwIfNotInitialized();
        this.session._redirectUrl = url;
        this._save();
    }

    setSessionEndedHeaderOverride(header) {
        this._throwIfNotInitialized();
        this.session._sessionEndedHeaderOverride = header;
        this._save();
    }

    setSessionEndedBodyOverride(body) {
        this._throwIfNotInitialized();
        this.session._sessionEndedBodyOverride = body;
        this._save();
    }

    setLastInteractionTime(time) {
        this._throwIfNotInitialized();
        this.session._lastInteractionTime = time;
        this._save();
    }

    setUserQuestionnaireEndedTime(time) {
        this._throwIfNotInitialized();
        this.session._user_questionnaire_ended = time;
        this._save();
    }

    setProlificUid(puid) {
        this._throwIfNotInitialized();
        this.session._prolificUid = puid;
        this._save();
    }

    setChatEnded(ended) {
        this._throwIfNotInitialized();
        this.session._chat_ended = ended;
        this._save();
    }

    setFinished(finished) {
        this._throwIfNotInitialized();
        this.session._finished = finished;
        this._save();
    }

    // Track and reset interaction time
    getAndResetInteractionTime() {
        this._throwIfNotInitialized();
        let currentTime = Date.now();
        let prevInteractionTime = currentTime;
        
        const lastTime = this.session._lastInteractionTime;
        if (lastTime) {
            prevInteractionTime = lastTime;
        }
        
        this.session._lastInteractionTime = currentTime;
        this._save();
        // return milliseconds passed since the last interaction
        return Math.floor((currentTime - prevInteractionTime));
    }
}

module.exports = {
    SessionManager
};