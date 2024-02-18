/**
 * @name TextReplacer
 * @author MahdeenSky
 * @version 1.2
 * @description Can replace text in messages using regex before sending them. By default, it fixes twitter and pixiv links.
 * @source https://github.com/MahdeenSky/BDPlugins/blob/main/TextReplacer/TextReplacer.plugin.js
 */

const BD = new BdApi("TextReplacer");
const { Filters, getModule } = BD.Webpack;

const MessageActionsFilter = Filters.byProps("jumpToMessage", "_sendMessage");
const MessageActions = getModule(m => MessageActionsFilter(m));

// Define the initial settings object with default values
const settings = {
    regexes: [
        { regex: "//(x|twitter)\\.com", replace: "//fxtwitter.com" },
        { regex: "pixiv\\.net", replace: "phixiv.net" }
    ]
};

// Function to update and save settings
function updateSettings(newSettings) {
    Object.assign(settings, newSettings);
    BD.Data.save("settings", settings);
}

module.exports = meta => ({
    start() {
        // Load the saved settings
        let loadedSettings = BD.Data.load("settings");
        if (typeof loadedSettings === 'object' && loadedSettings !== null && !(loadedSettings instanceof Array)) {
            Object.assign(settings, loadedSettings);
        }

        BD.Patcher.before(MessageActions, "sendMessage", (_, args) => {
            const msg = args[1];
            let definedRegex;
            for (let i = 0; i < settings.regexes.length; i++) {
                definedRegex = settings.regexes[i]
                msg.content = msg.content.replace(new RegExp(definedRegex.regex, "g"), definedRegex.replace);
            }
        });
    },
    stop() {
        BD.Patcher.unpatchAll();
    },
    getSettingsPanel() {
        // Build the settings panel
        const panel = document.createElement("div");
        panel.id = "TextReplacer-settings";
        panel.style.padding = "20px";
        panel.style.border = "1px solid #ccc";
        panel.style.borderRadius = "5px";

        const regexList = document.createElement("ul");
    
        // Function to rebuild the regex list
        function rebuildRegexList() {
            regexList.innerHTML = ''; // Clear the list
    
            settings.regexes.forEach((pair, index) => {
                const listItem = document.createElement("li");
                listItem.style.padding = "5px";
                listItem.style.listStyleType = "none";
                listItem.style.color = "#fff";
                listItem.style.lineHeight = "1.6";
    
                const regexLabel = document.createElement("span");
                regexLabel.style.fontWeight = "bold";
                regexLabel.textContent = `Regex ${index + 1}: `;
                listItem.appendChild(regexLabel);
    
                const regexValue = document.createElement("span");
                regexValue.textContent = pair.regex;
                listItem.appendChild(regexValue);
    
                const replaceLabel = document.createElement("span");
                replaceLabel.style.fontWeight = "bold";
                replaceLabel.style.marginLeft = "10px";
                replaceLabel.textContent = "Replaced with: ";
                listItem.appendChild(replaceLabel);
    
                const replaceValue = document.createElement("span");
                replaceValue.textContent = pair.replace;
                listItem.appendChild(replaceValue);
    
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.style.backgroundColor = "#ff0000";
                deleteButton.style.color = "#fff";
                deleteButton.style.border = "none";
                deleteButton.style.padding = "5px";
                deleteButton.style.marginLeft = "10px";
                deleteButton.style.cursor = "pointer";
                deleteButton.addEventListener("click", () => {
                    // Create a copy of the current list of regexes
                    const newRegexes = [...settings.regexes];
                    newRegexes.splice(index, 1);
                    // Update and save the settings with the new list
                    updateSettings({ regexes: newRegexes });
                    // Rebuild the list
                    rebuildRegexList();
                });
    
                listItem.appendChild(deleteButton);
                regexList.appendChild(listItem);
            });
        }
    
        rebuildRegexList(); // Build the initial regex list
    
        const addRegexField = document.createElement("input");
        addRegexField.type = "text";
        addRegexField.placeholder = "Enter a new regex";
        addRegexField.style.padding = "5px";
        addRegexField.style.marginTop = "10px";
    
        const addReplaceField = document.createElement("input");
        addReplaceField.type = "text";
        addReplaceField.placeholder = "Enter the replacement";
        addReplaceField.style.padding = "5px";
        addReplaceField.style.marginTop = "10px";
    
        const addButton = document.createElement("button");
        addButton.textContent = "Add Regex";
        addButton.style.backgroundColor = "#0074d9";
        addButton.style.color = "#fff";
        addButton.style.border = "none";
        addButton.style.padding = "10px";
        addButton.style.cursor = "pointer";
        addButton.style.marginTop = "10px";
        addButton.style.marginLeft = "2%";
        addButton.addEventListener("click", () => {
            const newRegex = addRegexField.value;
            const newReplace = addReplaceField.value;
            if (newRegex && newReplace) {
                // Create a copy of the current list of regexes
                const newRegexes = [...settings.regexes];
                // Add the new regex and replacement pair
                newRegexes.push({ regex: newRegex, replace: newReplace });
                // Update and save the settings with the new list
                updateSettings({ regexes: newRegexes });
                // Rebuild the list
                rebuildRegexList();
            }
        });
    
        panel.appendChild(regexList);
        panel.appendChild(addRegexField);
        panel.appendChild(addReplaceField);
        panel.appendChild(addButton);
    
        return panel;
    }

});
