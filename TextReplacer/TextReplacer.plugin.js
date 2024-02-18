/**
 * @name TextReplacer
 * @author MahdeenSky
 * @version 1.3
 * @description Can replace text in messages using regex before sending them. By default, it fixes twitter and pixiv links.
 * @source https://github.com/MahdeenSky/BDPlugins/blob/main/TextReplacer/TextReplacer.plugin.js
 */

const BD = new BdApi("TextReplacer");
const { Filters, getModule } = BD.Webpack;
const Settings = BdApi.React.createContext();
const MessageActionsFilter = Filters.byProps("jumpToMessage", "_sendMessage");
const MessageActions = getModule(m => MessageActionsFilter(m));
const Modals = getModule(x=>x.ConfirmModal)

const settings = {
    regexes: [
        { regex: "//(x|twitter)\\.com", replace: "//fxtwitter.com" },
        { regex: "pixiv\\.net", replace: "phixiv.net" }
    ]
};

function updateSettings(newSettings) {
    Object.assign(settings, newSettings);
    BdApi.Data.save("TextReplacer", "settings", settings);
}

function getSettings() {
    return BdApi.Data.load("TextReplacer", "settings");
}

module.exports = meta => ({
    start() {
        BD.Patcher.before(MessageActions, "sendMessage", (_, args) => {
            const msg = args[1];
            console.log(args)
            let definedRegex;
            for (let i = 0; i < getSettings().regexes.length; i++) {
                definedRegex = getSettings().regexes[i]
                msg.content = msg.content.replace(new RegExp(definedRegex.regex, "g"), definedRegex.replace);
            }
        });
    },
    stop() {
        BD.Patcher.unpatchAll();
    },
    getSettingsPanel() {
        return BdApi.React.createElement(Settings.Provider, {value: this}, BdApi.React.createElement(this.SettingsPanel));
    },

    SettingsPanel()
    {
        const createElement = BdApi.React.createElement;
        const useState = BdApi.React.useState;
    
        const [newRegex, setNewRegex] = useState('');
        const [newReplace, setNewReplace] = useState('');
        const [regexes, setRegexes] = useState(getSettings().regexes); // Add this line
    
        function rebuildRegexList() {
            return regexes.map((pair, index) => { // Change this line
                return createElement('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '10px' } },
                    createElement('div', { style: { flex: 1, padding: '5px', color: '#fff', lineHeight: '1.6' } },
                        createElement('span', { style: { fontWeight: 'bold' } }, `Regex ${index + 1}: `),
                        createElement('span', {}, pair.regex),
                        createElement('span', { style: { fontWeight: 'bold', marginLeft: '10px' } }, 'Replaced with: '),
                        createElement('span', {}, pair.replace)
                    ),
                    createElement(Modals.Button, {
                        style: { backgroundColor: '#ff0000', color: '#fff', border: 'none', padding: '5px', marginLeft: '10px', cursor: 'pointer' },
                        onClick: () => {
                            const newRegexes = [...regexes]; // Change this line
                            newRegexes.splice(index, 1);
                            setRegexes(newRegexes); // Add this line
                            updateSettings({ regexes: newRegexes });
                        }
                    }, 'Delete')
                );
            });
        }
    
        console.log(...rebuildRegexList())
    
        return createElement('div', { id: 'TextReplacer-settings', style: { padding: '20px', border: '1px solid #ccc', borderRadius: '5px' } },
        createElement('ul', {}, ...rebuildRegexList()),
        createElement(Modals.TextInput, { 
            type: 'text', 
            placeholder: 'Enter a new regex', 
            style: { padding: '5px', marginTop: '10px' },
            value: newRegex,
            onChange: (e) => setNewRegex(e)
        }),
        createElement(Modals.TextInput, { 
            type: 'text', 
            placeholder: 'Enter the replacement', 
            style: { padding: '5px', marginTop: '10px' },
            value: newReplace,
            onChange: (e) => setNewReplace(e)
        }),
        createElement(Modals.Button, {
            style: { backgroundColor: '#0074d9', color: '#fff', border: 'none', padding: '10px', cursor: 'pointer', marginTop: '10px', marginLeft: '2%' },
            onClick: () => {
                if (newRegex && newReplace) {
                    const newRegexes = [...regexes]; // Change this line
                    newRegexes.push({ regex: newRegex, replace: newReplace });
                    setRegexes(newRegexes); // Add this line
                    updateSettings({ regexes: newRegexes });
                    setNewRegex('');
                    setNewReplace('');
                }
            }
        }, 'Add Regex')
    );
    }

});
