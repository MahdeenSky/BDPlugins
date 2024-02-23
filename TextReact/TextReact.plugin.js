/**
 * @name TextReact
 * @version 1.0
 * @description Adds a 'Text React' option to the context menu of messages, allowing you to add text as reactions.
 * @author MahdeenSky
 * @source https://github.com/MahdeenSky/BDPlugins/blob/main/TextReact/TextReact.plugin.js
 */

module.exports = (() => {
  const config = {
      info: {
          name: "TextReact",
          authors: [{
              name: "MahdeenSky",
              discord_id: "385895514324992011",
          }],
          version: "1.0",
          description: "Adds a 'Text React' option to the context menu of messages, allowing you to add text as reactions.",
          github_raw: "https://github.com/MahdeenSky/BDPlugins/blob/main/TextReact/TextReact.plugin.js",
      },
  };

  return !global.ZeresPluginLibrary ? class {
      constructor() {
          this._config = config;
      }
      getName() {
          return config.info.name;
      }
      getAuthor() {
          return config.info.authors.map(a => a.name).join(", ");
      }
      getDescription() {
          return config.info.description;
      }
      getVersion() {
          return config.info.version;
      }
      load() {
          BdApi.showConfirmationModal("Library Missing", `The library plugin needed for **${config.info.name}** is missing. Please click Download Now to install it.`, {
              confirmText: "Download Now",
              cancelText: "Cancel",
              onConfirm: () => {
                  require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                      if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                      await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                  });
              },
          });
      }
      start() {}
      stop() {}
  } : (([Plugin, Api]) => {
      const plugin = (Plugin, Api) => {
          const {
              Logger,
              Patcher,
              WebpackModules
          } = Api;
          const {
              React,
              Webpack,
              ContextMenu
          } = BdApi;
          const {
              Filters
          } = Webpack;
          const ReactionModule = BdApi.findModuleByProps("addReaction", "removeAllReactions");

          return class TextReact extends Plugin {
              async onStart() {
                  this.patchContextMenu();
              }
              async onStop() {
                  Patcher.unpatchAll();
              }
              async patchContextMenu() {
                  this.contextpatch = ContextMenu.patch("message", (tree, props) => {
                      tree.props.children.push(
                          ContextMenu.buildItem({
                              type: "separator"
                          }),
                          ContextMenu.buildItem({
                              label: "Text React",
                              type: "text",
                              id: "context-TextReact",
                              action: () => {
                                  BdApi.showConfirmationModal("Text React", React.createElement("input", {
                                      type: "text",
                                      id: "reactionInput"
                                  }), {
                                      confirmText: "React",
                                      cancelText: "Cancel",
                                      onConfirm: () => {
                                          let input = document.getElementById("reactionInput").value;
                                          if (input) {
                                              let processedInput = this.textToEmoji(input);
                                              for (let i = 0; i < Math.min(20 - props.message.reactions.length, input.length); i++) {
                                                  setTimeout(() => {
                                                      ReactionModule.addReaction(props.message.channel_id, props.message.id, {
                                                          id: null,
                                                          name: processedInput[i],
                                                          animated: false
                                                      });
                                                  }, 1000 * i);
                                              }
                                          }
                                      }
                                  });
                              }
                          })
                      );
                  });
              }
              // adds space characters as it is
              removeDuplicateLetters(inputText) {
                  let seen = new Set();
                  let output = "";
                  for (let i = 0; i < inputText.length; i++) {
                      let char = inputText[i];
                      if (char === " ") {
                          output += char;
                      } else if (!seen.has(char)) {
                          seen.add(char);
                          output += char;
                      }
                  }
                  return output;
              }
              textToEmoji(inputText) {
                  const letterToEmoji = {
                      'a': '🅰️',
                      'b': '🅱️',
                      'c': '🇨',
                      'd': '🇩',
                      'e': '🇪',
                      'f': '🇫',
                      'g': '🇬',
                      'h': '🇭',
                      'i': '🇮',
                      'j': '🇯',
                      'k': '🇰',
                      'l': '🇱',
                      'm': '🇲',
                      'n': '🇳',
                      'o': '🇴',
                      'p': '🅿️',
                      'q': '🇶',
                      'r': '🇷',
                      's': '🇸',
                      't': '🇹',
                      'u': '🇺',
                      'v': '🇻',
                      'w': '🇼',
                      'x': '🇽',
                      'y': '🇾',
                      'z': '🇿'
                  };
                  // instantiate a set of space emojis without reference to the original array
                  let space_emojis = new Set(["⬛", "⬜", "🔳", "🔲"]);
                  inputText = this.removeDuplicateLetters(inputText.toLowerCase()); // Convert input text to lowercase for simplicity
                  let emojiArray = [];
                  for (let i = 0; i < inputText.length; i++) {
                      let char = inputText[i];
                      if (char === " ") {
                          if (space_emojis.size > 0) {
                              let space_emoji = space_emojis.values().next().value;
                              space_emojis.delete(space_emoji);
                              emojiArray.push(space_emoji);
                          }
                      } else {
                          let emoji = letterToEmoji[char]; // If emoji exists for the character, use it, else use the character itself
                          emojiArray.push(emoji);
                      }
                  }
                  return emojiArray; // Trim trailing space
              }
          };
      };
      return plugin(Plugin, Api);
  })(global.ZeresPluginLibrary.buildPlugin(config));
})();
