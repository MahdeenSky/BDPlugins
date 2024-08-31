/**
 * @name TextReplacer
 * @version 2.0
 * @author MahdeenSky
 * @authorLink https://github.com/MahdeenSky
 * @description Automatically replaces text in messages using a regex before sending them. By default, it fixes Twitter and Pixiv links by replacing the original links with a proxied counterpart, and also allows you to share YouTube videos without ads [Needs to be enabled in settings]. You can add your own regexes in the settings panel.
 * @source https://github.com/MahdeenSky/BDPlugins/blob/main/TextReplacer/TextReplacer.plugin.js
 * @updateUrl https://raw.githubusercontent.com/MahdeenSky/BDPlugins/main/TextReplacer/TextReplacer.plugin.js
 */

const BD = new BdApi("TextReplacer");
const { Filters, getModule } = BD.Webpack;
const MessageActionsFilter = Filters.byProps("jumpToMessage", "_sendMessage");
const MessageActions = getModule((m) => MessageActionsFilter(m));
const Modals = getModule((x) => x.ConfirmModal);

const defaultSettings = {
  regexes: [
    {
      name: "Twitter/X Embed Fix",
      regex: "//(x|twitter)\\.com",
      replace: "//vxtwitter.com",
      enabled: true,
      caseInsensitive: false
    },
    {
      name: "Pixiv Embed Fix",
      regex: "pixiv\\.net",
      replace: "phixiv.net",
      enabled: true,
      caseInsensitive: false
    },
    {
      name: "YouTube Videos No Ads",
      regex: "https?://(www\\.)?youtube\\.com/watch\\?v=([\\w-]+)",
      replace: "https://yt.cdn.13373333.one/watch?v=$2",
      enabled: false,
      caseInsensitive: false
    },
    {
      name: "YouTube Shorts No Ads",
      regex: "https?://(www\\.)?youtube\\.com/shorts/([\\w-]+)",
      replace: "https://yt.cdn.13373333.one/watch?v=$2",
      enabled: false,
      caseInsensitive: false
    }
  ],
};

function updateSettings(newSettings) {
  Object.assign(defaultSettings, newSettings);
  BdApi.Data.save("TextReplacer", "settings", defaultSettings);
}

function getSettings() {
  return BdApi.Data.load("TextReplacer", "settings") || defaultSettings;
}

module.exports = (meta) => ({
  start() {
    if (!getSettings()) {
      updateSettings(defaultSettings);
    }

    BD.Patcher.before(MessageActions, "sendMessage", (_, args) => {
      const msg = args[1];
      getSettings().regexes.forEach(definedRegex => {
        if (definedRegex.enabled) {
          const flags = definedRegex.caseInsensitive ? "gi" : "g";
          msg.content = msg.content.replace(
            new RegExp(definedRegex.regex, flags),
            definedRegex.replace,
          );
        }
      });

      // if the message content is empty, replace it with a zero width space so it doesn't fail to send
      if (msg.content.trim() === "") {
        msg.content = "‎";
      }
    });
  },

  stop() {
    BD.Patcher.unpatchAll();
  },

  getSettingsPanel() {
    return BdApi.React.createElement(SettingsPanel);
  },
});

function SettingsPanel() {
  const { useState } = BdApi.React;
  const [regexes, setRegexes] = useState(getSettings().regexes);
  const [newRegex, setNewRegex] = useState({ name: "", regex: "", replace: "", enabled: true, caseInsensitive: false});

  const updateRegexes = (updatedRegexes) => {
    setRegexes(updatedRegexes);
    updateSettings({ regexes: updatedRegexes });
  };

  const addRegex = () => {
    if (newRegex.name && newRegex.regex && newRegex.replace) {
      updateRegexes([...regexes, newRegex]);
      setNewRegex({ name: "", regex: "", replace: "", enabled: true, caseInsensitive: false });
    }
  };

  const updateRegex = (index, field, value) => {
    const updatedRegexes = regexes.map((regex, i) =>
      i === index ? { ...regex, [field]: value } : regex
    );
    updateRegexes(updatedRegexes);
  };

  const deleteRegex = (index) => {
    const updatedRegexes = regexes.filter((_, i) => i !== index);
    updateRegexes(updatedRegexes);
  };

  return BdApi.React.createElement(
    "div",
    {
      style: {
        padding: "20px",
        backgroundColor: "var(--background-primary)",
        color: "var(--text-normal)",
      }
    },
    BdApi.React.createElement("h2", null, "Text Replacer Settings"),
    regexes.map((regex, index) =>
      BdApi.React.createElement(RegexItem, {
        key: index,
        regex,
        index,
        updateRegex,
        deleteRegex
      })
    ),
    BdApi.React.createElement(
      "div",
      { style: { marginTop: "20px", padding: "15px", border: "1px solid var(--background-modifier-accent)", borderRadius: "5px" } },
      BdApi.React.createElement("h3", { style: { margin: "0 0 10px 0" } }, "Add New Regex"),
      BdApi.React.createElement(Modals.TextInput, {
        value: newRegex.name,
        onChange: (value) => setNewRegex({ ...newRegex, name: value }),
        placeholder: "Regex Name"
      }),
      BdApi.React.createElement(Modals.TextInput, {
        value: newRegex.regex,
        onChange: (value) => setNewRegex({ ...newRegex, regex: value }),
        placeholder: "Regular Expression"
      }),
      BdApi.React.createElement(Modals.TextInput, {
        value: newRegex.replace,
        onChange: (value) => setNewRegex({ ...newRegex, replace: value }),
        placeholder: "Replacement Text"
      }),
      BdApi.React.createElement(
        "label",
        { style: { display: "flex", alignItems: "center", marginTop: "10px" } },
        BdApi.React.createElement("input", {
          type: "checkbox",
          checked: newRegex.caseInsensitive,
          onChange: (e) => setNewRegex({ ...newRegex, caseInsensitive: e.target.checked }),
          style: { marginRight: "5px" }
        }),
        "Case Insensitive"
      ),
      BdApi.React.createElement(Modals.Button, {
        onClick: addRegex,
        color: Modals.Button.Colors.BRAND,
        style: { marginTop: "10px" }
      }, "Add Regex")
    )
  );
}

function RegexItem({ regex, index, updateRegex, deleteRegex }) {
  return BdApi.React.createElement(
    "div",
    {
      style: {
        marginBottom: "15px",
        padding: "15px",
        border: "1px solid var(--background-modifier-accent)",
        borderRadius: "5px",
        backgroundColor: "var(--background-secondary)",
      }
    },
    BdApi.React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" } },
      BdApi.React.createElement(Modals.TextInput, {
        value: regex.name,
        onChange: (value) => updateRegex(index, "name", value),
        placeholder: "Regex Name"
      }),
      BdApi.React.createElement(Modals.Button, {
        onClick: () => deleteRegex(index),
        color: Modals.Button.Colors.RED,
        size: Modals.Button.Sizes.SMALL
      }, "Delete")
    ),
    BdApi.React.createElement(Modals.TextInput, {
      value: regex.regex,
      onChange: (value) => updateRegex(index, "regex", value),
      placeholder: "Regular Expression"
    }),
    BdApi.React.createElement(Modals.TextInput, {
      value: regex.replace,
      onChange: (value) => updateRegex(index, "replace", value),
      placeholder: "Replacement Text"
    }),
    BdApi.React.createElement(
      "div",
      { style: { display: "flex", alignItems: "center", marginTop: "10px" } },
      BdApi.React.createElement(
        "label",
        { style: { display: "flex", alignItems: "center", marginRight: "15px" } },
        BdApi.React.createElement("input", {
          type: "checkbox",
          checked: regex.enabled,
          onChange: (e) => updateRegex(index, "enabled", e.target.checked),
          style: { marginRight: "5px" }
        }),
        "Enabled"
      ),
      BdApi.React.createElement(
        "label",
        { style: { display: "flex", alignItems: "center" } },
        BdApi.React.createElement("input", {
          type: "checkbox",
          checked: regex.caseInsensitive,
          onChange: (e) => updateRegex(index, "caseInsensitive", e.target.checked),
          style: { marginRight: "5px" }
        }),
        "Case Insensitive"
      )
    )
  );
}