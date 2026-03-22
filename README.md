# TRI-CA: Trials in Conversational Agents

## Purpose & Functinality

TRI-CA is a comprehensive web-based experimental research system designed for conducting controlled studies on human-AI interactions. 
It enables researchers to conduct rigorous experimental studies examining how humans interact with AI systems under controlled conditions.
It supports multi-stage experimental designs with randomized treatment groups, ensuring robust data collection for academic research.
Built with Node.js and Express, it provides a complete experimental workflow from participant onboarding, going through a random treatment group's specific configuration, and ends with data collection.


### **Key Research Capabilities:**

- **Hidden Prompt Control**: Researchers can dynamically control AI system instructions that remain invisible to participants, enabling manipulation of AI personality, behavior, or capabilities across experimental conditions
- **Comprehensive Questionnaire Management**: Full control over pre- and post-interaction questionnaires with configurable question types, randomization, and conditional logic for measuring baseline characteristics and outcome variables
- **Complex Factorial Experimental Designs**: Support for sophisticated experimental frameworks (2×2, 2×2×2 and beyond) through treatment group configurations, enabling researchers to study multiple independent variables and their interactions simultaneously

## Key Features & Contributions

### **1. Complete Experimental Workflow**
- **Participant Onboarding and Verification**: Code-based authentication with database validation
- **Informed Consent**: Digital consent collection with opt-out handling (IRB)
- **Pre-Study Questionnaires**: Configurable baseline measurements/questionnaires
- **AI Chat Interface**: Real-time interaction with LLMs (default to OpenAI GPT models)
- **Post-Study Assessment**: Comprehensive outcome measurements/questionnaires
- **Session Completion**: Automated collection and storage of all questionnaire responses and complete conversation logs with precise interaction timing

### **2. Experiment Configuration Via Treatment Groups**
- **Configurable Conditions**: CSV-driven experimental design
- **Balanced Assignment**: Uniform randomization and assignment to treatment groups
- **Session Independence**: Each participant session is independent with its own state management and assigned treatment group
- **Independent Experiment Configuration Per Group**: Control over questions, task description, hidden prompts, user preferences, etc. per treatment group
- **Question Band**: Question bank to configure pre/post questionnaires with various question types and randomization rules
- **Hidden Prompt Bank**: Centralized management of hidden prompt filess for different treatment groups
- **User Task Bank**: Centralized management of task description filess for participants

### **3. Flexible Question Framework**
- **Dynamic Questionnaires**: CSV-configured question banks
- **Multiple Question Types**: Text, Likert scales, multiple choice, labels
- **Block Randomization**: Randomizable question groups
- **Grouped Likert**: Efficient matrix-style rating scales
- **HTML Support**: Rich text formatting for experiment instructions and questions via HTML in CSV configuration

### **4. Platform Integrations**
- **Prolific Compatibility**: Seamless integration with Prolific Academic (saving prolific_pid) 
- **OpenAI API**: Real-time GPT-4o chat completions model (the model is configurable via environment variable)
- **Database Backed Storage**: Full experiment control and data collection via 2 PostgreSQL Tables
- **Codes table**: for participant code validation
- **Data Collection Table**: Json format storage of each participant's complete session data, including questionnaire responses, conversation logs, timestamps, and metadata
- **Temporal Tracking**: Interaction timing and session duration measurement
- **Base64 Encoding**: 64-base encoded data transmission and storage (default on)

### **5. Data Collection Capabilities**
- **Interaction Logs**: Complete conversation histories with timing
- **Behavioral Measurements**: Response patterns and engagement metrics
- **Attitudinal Assessments**: Likert scales and open-ended responses
- **Participant Demographics**: Background characteristics and preferences
- **Technical Metadata**: Session details and platform interactions

### **6. Supported Study Types**
- **Conversational AI Evaluation**: User experience with different AI personalities
- **Prompt Engineering Research**: Effects of different system instructions
- **Human-AI Collaboration**: Task performance with AI assistance
- **Trust and Anthropomorphism**: Perception studies with varied AI presentations
- **Intervention Studies**: Before/after measurements with AI interactions



## Getting Started

### Quick Start (5 minutes, local smoke test)
Note: this Quick Start runs fully locally without PostgreSQL support — the server will not perform code-based authentication against a database when using `REUSABLE_CODE`, and collected results are appended to the local file specified by `RESULTS_FILE` on your filesystem.

#### 1. **Clone the repository**

```bash
git clone <repo-url>
cd <repo-directory>
```

#### 2. **Install dependencies**

```bash
npm install
```

#### 3. **Run a minimal server for testing (no database required)**
Use the provided test reusable code `REUSABLE_CODE=123123123` to skip DB validation and write results to a local file. For a full flow test without calling OpenAI, omit `OPENAI_API_KEY`; the app will use its built-in fake response, or you can override it with `FAKE_LLM_RESPONSE`.

```bash
REUSABLE_CODE=123123123 \
FAKE_LLM_RESPONSE="This is a fake TRI-CA response for local testing." \
RESULTS_FILE=/tmp/results.txt \
node app.js
```

#### 4. **Connect to the experiment website**
- Open the browser and visit http://localhost:3030 (or the port printed by the server).

#### 5. **Test flow**
- Enter the reusable code above when prompted to proceed as a test participant.
- Walk through consent, baseline questionnaire, the AI chat task, and post-study questionnaire.
- Results will be appended to the file set by `RESULTS_FILE` (default: none) or stored in PostgreSQL if configured.



### Full Setup (production-like deployment)

#### 1. **Clone the repository**

```bash
git clone <repo-url>
cd <repo-directory>
```

#### 2. **Database Configuration (and PostgreSQL schema)**
Set up PostgreSQL database tables for participant codes and results storage. See detailed schema and setup instructions in [`pre_requisites/postgres_table.txt`](pre_requisites/postgres_table.txt).


#### 3. **Node.js Environment Setup**
Install Node.js and required dependencies for local or cloud deployment:
```bash
npm install  # Installs all dependencies listed in package.json
```
See [`package.json`](package.json) for complete dependency list including Express, OpenAI, and PostgreSQL drivers.

#### 4. **Experimental Configuration Files**
Configure three core CSV files that control your experimental design:

- **[`experiment_configuration/experiment_desc.csv`](experiment_configuration/experiment_desc.csv)** - Page content, titles, headers, and body text for each stage of the experiment
- **[`experiment_configuration/treatment_groups_config.csv`](experiment_configuration/treatment_groups_config.csv)** - Treatment group assignments, hidden prompts, user preferences, and randomization settings for factorial designs
- **[`experiment_configuration/questions_bank.csv`](experiment_configuration/questions_bank.csv)** - Pre/post questionnaire items, question types, randomization rules, and Likert scale configurations

#### 5. **API Credentials & Database Connection**
Configure required connection strings and API keys:
- **OpenAI API Key**: Register at OpenAI and obtain API credentials for GPT model access
- **PostgreSQL Connection String**: Database connection details for backend data storage (both codes as well as each participant's completed session data)

#### 6. **Participant Access Codes**
Generate unique participant codes and insert into database. Use the provided Python script for code generation:
```bash
python pre_requisites/generate_codes.py
```
See [`pre_requisites/generate_codes.py`](pre_requisites/generate_codes.py) for example implementation.


#### 7. **Environment Variables**
Configure required environment variables:
```bash
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3030  # Optional: defaults to 3030
```

**Required Variables:**
- `OPENAI_API_KEY`: Your OpenAI API key for chat completions
- `DATABASE_URL`: PostgreSQL connection string for data storage


**Optional Variables (yet useful). Default values are set in ./config.js:**
- `PORT`: Server port (defaults to 3030).
- `RESULTS_FILE`: Path to append results as lines of JSON (useful for quick capture).
- `BASE64_ENCODE`: If set (non-zero), data stored/transmitted will be base64-encoded by default.
- `REUSABLE_CODE`: Developer testing code that bypasses DB code-check (useful for local testing).
- `EXPERIMENT_ID`: Identifier for the experiment.
- `COMPLETE_CODE`: Completion code given to participants when they finish the study.
- `REDIRECT_URL`: URL to redirect participants after completion (used to redirect users back to the referrer site ,e.g. Prolific).
- `OPENAI_TOKEN_LIMIT`: Maximum tokens for OpenAI responses (default is 1000).
- `OPENAI_MODEL`: OpenAI model to use (default `gpt-4o`).
- `FAKE_LLM_RESPONSE`: Fixed assistant reply used when `OPENAI_API_KEY` is not set. If no API key is provided, this variable is required.
- `RESULTS_PGTABLE`: PostgreSQL table name for results storage (default `tri_ca_results`).
- `CODES_PGTABLE`: PostgreSQL table name for participant codes (default `tri_ca_codes`).
- `SESSION_SECRET`: Secret used to sign session cookies. If omitted, the server generates a secure random secret at startup.


#### 8. **Launch Application**
Start the server locally (requires Node.js installation):
```bash
# Example with all environment variables
OPENAI_API_KEY=your_openai_api_key_here \
PORT=8080 \
DATABASE_URL=postgres://user:password@host:5432/database \
BASE64_ENCODE=1 \
RESULTS_FILE=/tmp/results.txt \
OPENAI_TOKEN_LIMIT=2000 \
REUSABLE_CODE=123123123 \
EXPERIMENT_ID=test \
COMPLETE_CODE=testcompletecode1 \
node app.js

# Minimal launch .Uses defaults, data collection is added to /tmp/results.txt as clear text(no base64 encoding). Also, for testing, the code "123123123" skips database validation.
REUSABLE_CODE=123123123 FAKE_LLM_RESPONSE="This is a fake TRI-CA response for local testing." RESULTS_FILE=/tmp/results.txt node app.js

# Access at: http://localhost:8080 (or your specified PORT)
```

## Technical Architecture

### **Data Flow**
1. **Participant Authentication** → Code validation against database
2. **Session Initialization** → Treatment group assignment and preferences
3. **Consent Collection** → Digital consent with decline handling
4. **Baseline Measurement** → Pre-study questionnaire administration
5. **Experimental Task** → AI chat interaction with hidden prompts
6. **Outcome Assessment** → Post-study questionnaire collection
7. **Data Collection** → Results serialization and database persistence

### **Backend Components**
- **Express.js Server**: HTTP request handling and middleware
- **Session Management**: Custom class-based session state management
- **CSV Processing**: Dynamic configuration loading
- **Database Layer**: PostgreSQL integration with connection pooling
- **API Integration**: OpenAI chat completions


### **Participant flow (what a participant experiences)**

1. Visit site and enter an access code (a short numeric/string code generated by the researcher).
2. The platform validates the code (unless `REUSABLE_CODE` is being used for quick local testing).
3. The session initializes and assigns a deterministic treatment group based on the participant ID.
4. Participant reads and signs consent (or declines and exits).
5. Participant completes baseline questionnaire.
6. Participant performs the experimental task (chat with the LLM). The LLM receives a hidden system prompt based on the assigned treatment group.
7. Participant completes post-study questionnaires.
8. Session data (responses + full chat log + timestamps) are serialized and saved.

- **Design note:** treatment assignment is deterministic and balanced (uses the participant UID modulo the number of treatment groups), which supports reproducible assignments for analysis.


### **Where to put your configuration files**

- `experiment_configuration/treatment_groups_config.csv` — The main controlling csv file for treatment definitions and hidden prompts.
- `experiment_configuration/experiment_desc.csv` — page content and text for each experiment stage.
- `experiment_configuration/questions_bank.csv` — questionnaire items and groupings.
- `experiment_configuration/hidden_prompts_bank/` — prompt files referenced by `treatment_groups_config.csv`.
- `experiment_configuration/user_tasks_bank/` — task descriptions for participants.

**Configuration File Column Reference**

- **`experiment_configuration/treatment_groups_config.csv`**
	- **treatment_group**: Numeric ID for the treatment; used to assign participants to a deterministic group.
	- **user_name**: Display name for the human participant identity (optional; shown in the UI if present).
	- **user_avatar**: Avatar image filename for the participant (from `static/images/avatars`); used in chat UI.
	- **agent_name**: Display name for the agent/AI shown to participants.
	- **agent_avatar**: Avatar image filename for the agent; displayed in chat UI.
	- **hidden_prompt**: Filename (under `experiment_configuration/hidden_prompts_bank/`) containing the system/hidden prompt injected to the LLM for this treatment group (applied at the begining of the conversation as the system role).
	- **user_task_description**: Filename (under `experiment_configuration/user_tasks_bank/`) or HTML snippet describing the participant task; rendered on the chat page, before the chat begins.
	- **user_pre_questions**: Semicolon-separated question block names (from `questions_bank.csv`) to present before the task.
	- **user_post_questions**: Semicolon-separated question block names (from `questions_bank.csv`) to present after the task.

- **`experiment_configuration/experiment_desc.csv`**
	- **page**: Page key / route name (e.g., `chat`, `consent`, `pre_questionnaire`) used to map CSV rows to site pages.
	- **title**: Page title (used in the HTML `<title>` and page header).
	- **header**: Short header text displayed on the page.
	- **body1**: Main body HTML/text for the page (may include markup).

- **`experiment_configuration/questions_bank.csv`**
	- **block_name**: Logical group name for a set of questions (referenced from `treatment_groups_config.csv`).
	- **allow_block_permutation**: `1`/`0` flag — whether blocks may be permuted (randomized) when shown.
	- **allow_question_permutation**: `1`/`0` flag — whether questions inside the block may be permuted.
	- **question_name**: Unique identifier/key for the question (used as the response field name in saved results).
	- **question_text**: The question prompt or instructions (may include HTML); shown to participants.
	- **is_text**: `1`/`0` — render a free-text input when `1`.
	- **is_likert**: `1`/`0` — render a Likert-style scale (single item) when `1`.
	- **is_grouped_likert**: `1`/`0` — render a grouped/matrix Likert (multiple labeled items sharing the same scale) when `1`.
	- **is_multi_choice**: `1`/`0` — render a multiple-choice input when `1`.
	- **is_label**: `1`/`0` — indicates the row is a non-input label/header (not a response item).
	- **options**: Pipe-separated (`|`) option labels or scale endpoints; used for `is_likert`, `is_multi_choice`, and grouped-likert options.

Notes:
- Flags are treated as truthy (`1`) / falsy (`0`) in code; conform to that convention in CSVs.
- `user_pre_questions` and `user_post_questions` in the treatment CSV should match `block_name` values in `questions_bank.csv` (semicolon-separated).
- `hidden_prompt` should reference a plain text file in `experiment_configuration/hidden_prompts_bank/` and will be used as the LLM system message.
- `user_task_description` should point to an HTML file under `experiment_configuration/user_tasks_bank/` to render task instructions.
- **CSV quoting**: these are standard comma-separated files parsed by the [`csv-parser`](https://www.npmjs.com/package/csv-parser) npm package (RFC 4180). If a field value contains a comma or newline, wrap it in double quotes (e.g., `"Hello, world"`). To include a literal double quote inside a quoted field, double it (e.g., `"She said ""hello"""`).

### **Question Types**

The questionnaire framework supports five question types, each optimized for different types of data collection:

#### **1. Text (`is_text`)**
- **Appearance**: Single or multi-line text input box.
- **Use case**: Open-ended responses, opinions, explanations, free-form feedback.
- **Options**: No structured options; participants enter arbitrary text.
- **Example CSV**: `is_text: 1`, all other type flags `0`.

#### **2. Likert Scale (`is_likert`)**
- **Appearance**: Single horizontal or vertical scale with labeled endpoints and intermediate points.
- **Use case**: Measuring agreement, satisfaction, or attitude on a single dimension (e.g., "Strongly Disagree" to "Strongly Agree").
- **Options**: Defined in the `options` column as pipe-separated endpoints and midpoints (e.g., `Strongly Disagree|Disagree|Neutral|Agree|Strongly Agree`).
- **Example CSV**: `is_likert: 1`, `options: "1|2|3|4|5"` or `options: "Strongly Disagree|Agree"`.

#### **3. Grouped Likert / Matrix (`is_grouped_likert`)**
- **Appearance**: Multiple labeled rows (items) sharing the same Likert scale; renders as an efficient matrix table when consecutive questions use the same scale.
- **Use case**: Measuring multiple related items on a common scale (e.g., rating multiple AI traits or task aspects).
- **Options**: Defined in the `options` column (shared scale, same as single Likert).
- **Grouping behavior**: Consecutive `is_grouped_likert` questions with identical `options` are automatically combined into a single matrix table. Non-consecutive grouped Likerts or those with different scales render individually.
- **Example CSV**: Multiple rows with `is_grouped_likert: 1` and the same `options: "1|2|3|4|5"`.

#### **4. Multiple Choice (`is_multi_choice`)**
- **Appearance**: Radio buttons or dropdown with mutually exclusive options.
- **Use case**: Selecting one answer from a fixed set (e.g., "What is your primary use case?").
- **Options**: Defined in the `options` column as pipe-separated choices (e.g., `Option A|Option B|Option C`).
- **Example CSV**: `is_multi_choice: 1`, `options: "Yes|No|Unsure"`.

#### **5. Label (`is_label`)**
- **Appearance**: Static text, header, or instructional content (no input field).
- **Use case**: Breaking up questionnaires with section headers, instructions, or visual separators.
- **Options**: No options; the `question_text` field contains the HTML/text to display.
- **Example CSV**: `is_label: 1`, `question_text: "<h3>Section 2: AI Trustworthiness</h3>"`.

#### **Questions and Blocks**

Questions are organized into **blocks** — named groups that can be assigned to treatment groups via the `user_pre_questions` and `user_post_questions` columns in `treatment_groups_config.csv`. Blocks provide flexibility:
- Each block can be **independently randomized** (block permutation, question permutation, or both) via the `allow_block_permutation` and `allow_question_permutation` flags.
- Different treatment groups can present different blocks (e.g., group A gets a "Trust" block, group B gets an "Anthropomorphism" block).
- Each question is **uniquely identified by its `question_name`**. see limitations below.

## Security Considerations / Limitations

### **SESSION_SECRET deployment note:**
- If `SESSION_SECRET` is auto-generated at startup, active sessions become invalid after server restart.
- If multiple servers need to serve the same sessions, they must all use the same `SESSION_SECRET`.

For typical research deployments (up to hundreds of concurrent participants on a single server, with no restarts expected mid-study), the auto-generated secret is sufficient. A fixed `SESSION_SECRET` is only necessary if you require high resiliency or failover across multiple servers — which is generally not needed for academic research studies.

### **Participant code security note:**
Participant codes are simple short strings — not cryptographic tokens. They are distributed to participants out-of-band, typically via a recruitment platform such as [Prolific](https://www.prolific.com/), where the researcher assigns one unique code per participant. This is considered safe enough for research purposes: the platform marks each code as completed after a session finishes, preventing it from being reused for a second completed session.


### **Incomplete sessions are not saved**: 
Session data (responses, chat log, timestamps) is only persisted when a participant completes the full flow and reaches the final submission step. Participants who drop out mid-session leave no data behind.

### **Re-entry with the same code**: 
If a participant starts a session but does not complete it (e.g., closes the browser, or opens a new incognito window after their cookie is cleared), and then re-enters the same code, the platform will accept it and serve a new session. Both sessions' results will be saved independently upon completion. This is a deliberate design tradeoff — it avoids false negatives (blocking legitimate re-entries) at the cost of allowing rare duplicate completions, which researchers should be aware of when cleaning collected data.

### **Malformed CSV configuration files can crash the server**:
All three configuration CSVs are loaded at startup and parsed into memory with minimal validation. A malformed or structurally inconsistent CSV (e.g., missing required columns, broken quoting, unexpected delimiters, or mismatched block names) can cause the server to crash on startup or produce runtime errors mid-session. Researchers should always test any CSV changes locally before deploying to a live study — at minimum by starting the server and walking through the full participant flow with a test code.

### **Question names must be globally unique**:
Each question is uniquely identified by its `question_name` in `questions_bank.csv`. A `question_name` cannot appear in multiple blocks — doing so will cause responses from different blocks to overwrite each other. If you need the same question content in multiple blocks (e.g., the same trust rating before and after the task), duplicate the row with a different `question_name` (e.g., `trust_ai_pre` and `trust_ai_post`).


---

## Developer Guide

### **Folder Structure**

```
app.js                            # Express server — routes, middleware chain, POST handlers
config.js                         # Environment variable bindings (all env vars read here)
helpers.js                        # Core logic: CSV loading, session rendering, question building, DB ops
sessionManagement.js              # SessionManager class — wraps express-session with typed getters/setters

experiment_configuration/
    experiment_desc.csv           # Page-level content (title, header, body) keyed by page name
    treatment_groups_config.csv   # One row per treatment group; controls prompts, avatars, questions
    questions_bank.csv            # All questionnaire items; grouped into named blocks
    hidden_prompts_bank/          # Plain-text LLM system prompt files (referenced by treatment CSV)
    user_tasks_bank/              # HTML task-description files (referenced by treatment CSV)

views/
    layout.pug                    # Base HTML layout (all pages extend this)
    welcome_code.pug              # Participant code entry page
    consent.pug                   # Informed consent page
    user_questionnaire.pug        # Shared template for pre- and post-study questionnaires
    chat.pug                      # Chat interface (task description + message thread)
    session_ended.pug             # Study completion / opt-out page
    error.pug                     # Generic error page

static/
    images/avatars/               # Avatar image files referenced by treatment CSV columns
    stylesheets/style.css         # Global stylesheet
    fonts/                        # Web fonts

pre_requisites/
    generate_codes.py             # Script to bulk-generate participant codes for DB insertion
    postgres_table.txt            # PostgreSQL schema for codes and results tables
```

---

### **Server Initialization**

On the **first request** (any route), the `verifySystemInitialized` middleware calls `helpers.waitForSystemInitializiation()`. This is a one-time async bootstrap that:

1. **Reads all CSVs** (`helpers.readAllCsvFiles()`):
   - Scans `experiment_configuration/` for `*.csv` files.
   - Streams each file through the `csv-parser` library and collects rows into `csvDB[filename]`.
   - Populates three in-memory arrays used throughout the app:
     - `treatmentFroupConfigRecords` ← `treatment_groups_config.csv`
     - `userQuestionnaireRecords` ← `questions_bank.csv`
     - `experimentDescRecords` ← `experiment_desc.csv`
   - Derives `treatmentGroups` — a deduplicated sorted array of `treatment_group` integers; used for assignment math.

2. **Loads file banks** (`helpers.loadFileBank()`):
   - Reads every file in `hidden_prompts_bank/` into the `hiddenPromptsBank` object (`filename → string content`).
   - Reads every file in `user_tasks_bank/` into `userTasksBank` (`filename → HTML string`).

3. Sets `isSystemInitialized = true`; subsequent requests skip all of the above instantly.

---

### **Session Lifecycle**

Every request passes through a shared middleware stack defined in `app.use([...])`:

```
verifySystemInitialized → verifySession → verifySessionEnded
```

#### `verifySession`
Runs on every request. If the session has no UID yet (new visitor):
- Generates a random integer UID (`0`–`maxUID`).
- Assigns a **treatment group**: `treatmentGroups[uid % treatmentGroups.length]` — deterministic and balanced across groups.
- Extracts Prolific URL parameters (`prolific_pid`, `study_id`, `session_id`) from the query string.
- Calls `sessionManager.initialize()` and `sessionManager.setPreferences()` (loads avatar filenames and display names from the treatment group row).

#### `verifySessionEnded`
If `sessionManager.getFinished()` is `true` (set either on consent decline or post-questionnaire submission):
- Fetches rendering params for the `session_ended` page.
- Applies any header/body overrides stored in the session (e.g., "You opted out" for declines).
- Injects `completion_code` and `redirect_url` if configured.
- Renders `./session_ended`.
- If consent was given: calls `handleUserCompleted()` — serializes session to JSON (optionally Base64-encoded), writes to `RESULTS_FILE` and/or inserts into the PostgreSQL results table, marks the participant code as completed in the DB, then destroys the session.
- If consent was declined: destroys the session without saving.

---

### **GET `/` — The Participant Flow (Middleware Chain)**

All participant-facing pages are served from a single `GET /` route, guarded by an ordered middleware chain. Each middleware either **renders a page and stops**, or **calls `next()`** to pass control to the next stage. This enforces a strict linear flow:

```
renderSessionCode → renderUserConsent → renderPreQuestionnaire → renderChat → renderChatQuestionnaire
```

#### 1. `renderSessionCode` — Code Entry
- **Condition**: `sessionManager.getCode()` is falsy.
- Calls `helpers.getRenderingParamsForPage("welcome_code")` → looks up the `welcome_code` row in `experimentDescRecords` → returns `{ title, header_message, body_message }`.
- Adds `form_type: "welcome_code"` to render params.
- Renders `./welcome_code`.

#### 2. `renderUserConsent` — Informed Consent
- **Condition**: `sessionManager.getConsent()` is falsy.
- Fetches rendering params for `"consent"` (including the full consent HTML from the `body1` CSV column).
- Adds `form_type: "consent"`.
- Renders `./consent`.

#### 3. `renderPreQuestionnaire` — Pre-Study Questionnaire
- **Condition**: `sessionManager.getPreQuestionsAnswers()` is falsy.
- Calls `helpers.getUserTestQuestions(req, "user_pre_questions")`:
  - Reads the `user_pre_questions` column of the participant's treatment group row (semicolon-separated block names).
  - For each block name, filters `userQuestionnaireRecords` and assembles question objects (`name`, `label`, `is_text`, `is_likert`, `is_grouped_likert`, `is_multi_choice`, `is_label`, `choices`).
  - Applies block-level and question-level permutation (Fisher-Yates shuffle) if `allow_block_permutation` / `allow_question_permutation` flags are set.
  - Groups consecutive `is_grouped_likert` questions sharing the same scale endpoints into a single matrix widget.
- If no questions → auto-sets answers to `{}` and redirects to `/` (skips stage).
- Otherwise renders `./user_questionnaire` with `form_type: "pre_questionnaire"`.

#### 4. `renderChat` — AI Chat Task
- **Condition**: `sessionManager.getChatEnded()` is falsy.
- Calls `helpers.setSelectedHiddenPromptToSession(req)`:
  - Looks up `hidden_prompt` filename from the treatment group row.
  - Reads the file content from `hiddenPromptsBank` and stores it in the session as the system role content.
- If the hidden prompt is empty (blank `hidden_prompt` cell) → **skips the chat stage** by marking `chatEnded = true` and calling next.
- Otherwise fetches rendering params for `"chat"`, attaches:
  - `preferences` (user/agent names and avatar paths from `getUserPreferences()`).
  - `task_description` (HTML from `userTasksBank`, keyed by the `user_task_description` column).
  - `form_type: "chat_ended"`.
- Renders `./chat`.

#### 5. `renderChatQuestionnaire` — Post-Study Questionnaire
- **Condition**: `sessionManager.getQuestionsAnswers()` is falsy.
- Calls `helpers.getUserTestQuestions(req, "user_post_questions")` (same logic as pre-questionnaire, using the `user_post_questions` column).
- Renders `./user_questionnaire` with `form_type: "post_questionnaire"`.

---

### **POST `/submit_user_response` — Unified Form Handler**

All form submissions POST to a single endpoint. The `form_type` hidden field (injected into every rendered form) determines which handler runs:

| `form_type` | Handler | What it does |
|---|---|---|
| `welcome_code` | `handleWelcomeCodeSubmission` | Validates the submitted code against DB (`SELECT completed WHERE code=? AND expid=?`) or `REUSABLE_CODE`. On success, stores code in session. Reconciles `prolific_pid` if it differs between URL param and form field. |
| `consent` | `handleConsentSubmission` | Checks all `consent.*` fields for `"YES"`. Any non-YES → sets `finished=true` with opt-out messaging. Otherwise sets `consent=true`. |
| `pre_questionnaire` | `handlePreQuestionnaireSubmission` | Stores the entire `req.body` (all question responses) into `sessionManager.setPreQuestionsAnswers()`. |
| `chat_ended` | `handleChatEndedSubmission` | Sets `sessionManager.setChatEnded(true)`. Triggered when the participant clicks "End Chat" in the UI. |
| `post_questionnaire` | `handlePostQuestionnaireSubmission` | Stores answers, sets `finished=true`, attaches `redirect_url` and `completion_code` from config, records the questionnaire end timestamp. |

After every handler, the request is redirected to `GET /`, where the middleware chain re-evaluates and advances to the next stage.

---

### **POST `/chat-api` — LLM Proxy**

Called by the chat UI for each message turn:
1. Appends `{ role: "user", content, interactionTime }` to the session's conversation context.
2. Builds the full prompt: `[{ role: "system", content: <hiddenPrompt> }, ...conversationHistory]`.
3. Calls OpenAI's `chat.completions.create` with the configured model, token limit, and temperature.
4. Appends `{ role: "assistant", content: reply }` to the session context.
5. Returns the reply text to the client.

The current implementation uses the OpenAI chat completions format, where the full conversation passed to the API is a flat array of messages with alternating roles:

```javascript
[
  { role: "system",    content: "<hidden prompt text>" },
  { role: "user",      content: "Hello, can you help me?" },
  { role: "assistant", content: "Of course! What do you need?" },
  { role: "user",      content: "..." },
  // ... full history for every turn
]
```

The entire history is re-sent on every turn, which gives the model full conversation context.

#### **Swapping the LLM provider**

The entire LLM integration is isolated in a single function in `app.js`:

```javascript
async function getLLMResponse(conversation) { ... }
```

To use a different provider, replace only this function. The contract is:
- **Input**: `conversation` — an array of `{ role, content }` message objects in OpenAI chat format (system message first, followed by alternating user/assistant turns).
- **Output**: a `Promise<string>` — the assistant's reply text.

Example swap for any OpenAI-compatible endpoint (e.g., a local Ollama server):

```javascript
async function getLLMResponse(conversation) {
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', messages: conversation })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}
```

Nothing else in the codebase needs to change — the route handler, session context management, and hidden prompt injection are all provider-agnostic.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## Citation

If you use this platform in academic work, please cite the associated publication.

### Preferred citation

```bibtex
@misc{tri_ca_platform,
  title        = {TRI-CA: Trials in Conversational Agents},
  author       = {Contributors},
  year         = {2026},
  howpublished = {GitHub repository},
  note         = {Please replace this entry with the official paper citation when available}
}
```

If/when a formal paper (or preprint/DOI) is available, replace the BibTeX entry above with the official citation.
