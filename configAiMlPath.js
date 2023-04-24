// const dotenv = require('dotenv').config();
// const { AIML_ENGINE_MAIN_FILE_PATH } = process.env;
// module.exports = {
//     aimlPath : AIML_ENGINE_MAIN_FILE_PATH
// };

// module.exports = {
//     aimlPath : "D:/Codding/EmailClassificationProject/aiml/Python_AI_ML_Engine_final_script.py"
// };


const path = require("path");
let aimlPathStr = path.join(__dirname, '../aiml/Python_AI_ML_Engine_final_script.py');
aimlPathStr = aimlPathStr.replace('\\', '/');
module.exports = {
    aimlPath : aimlPathStr
};