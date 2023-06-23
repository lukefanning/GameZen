/**
 * @name GameZen
 * @author Théo EwzZer
 * @authorId 384009727253807105
 * @authorLink https://github.com/TheoEwzZer
 * @description Automatically activates Do Not Disturb mode when a game is launched.
 * @donate https://www.paypal.me/TheoEwzZer
 * @source https://github.com/TheoEwzZer/GameZen
 * @updateUrl https://raw.githubusercontent.com/TheoEwzZer/GameZen/main/GameZen.plugin.js
 * @version 0.0.2
 */

/**
 * The module for accessing user settings.
 * @typedef {Object} UserSettingsProtoStore
 * @property {Object} settings - The user settings object.
 */
const UserSettingsProtoStore = BdApi.Webpack.getModule(
  (m) =>
    m &&
    typeof m.getName == "function" &&
    m.getName() == "UserSettingsProtoStore" &&
    m,
  { first: true, searchExports: true }
);

/**
 * Utility functions for updating user settings.
 * @typedef {Object} UserSettingsProtoUtils
 * @property {Function} updateAsync - Asynchronously updates a user setting.
 */
const UserSettingsProtoUtils = BdApi.Webpack.getModule(
  (m) =>
    m.ProtoClass && m.ProtoClass.typeName.endsWith(".PreloadedUserSettings"),
  { first: true, searchExports: true }
);

const ERRORS = {
  INVALID_GAME_NAME: "Invalid game name:",
  ERROR_UPDATING_USER_STATUS: "Error updating user status:",
  ERROR_STARTING_GAMEZEN: "Error starting GameZen:",
  ERROR_STOPPING_GAMEZEN: "Error stopping GameZen:",
  ERROR_SAVING_SETTINGS: "Error saving settings:",
  ERROR_GETTING_CURRENT_USER_STATUS: "Error getting current user status:",
  ERROR_UPDATING_USER_STATUS_TO_CURRENT_STATUS:
    "Error updating user status to current status:",
  ERROR_UPDATING_USER_STATUS_TO_DND: "Error updating user status to DND:",
};

const SETTINGS = { gameName: "Game Name" };

module.exports = class GameZen {
  /**
   * Constructor for the GameZen class.
   */
  constructor(meta) {
    this.meta = meta;
    this.found = false;
  }

  /**
   * Updates the remote status to the param `toStatus`
   * @param {('online'|'idle'|'invisible'|'dnd')} toStatus
   */
  updateStatus(toStatus) {
    UserSettingsProtoUtils.updateAsync(
      "status",
      (statusSetting) => {
        statusSetting.status.value = toStatus;
      },
      0
    );
  }

  /**
   * @returns {string} the current user status
   */
  currentStatus() {
    return UserSettingsProtoStore.settings.status.status.value;
  }

  /**
   * Activates Do Not Disturb mode when a game is launched.
   */
  start() {
    Object.assign(SETTINGS, BdApi.loadData(this.meta.name, "settings"));
    this.currentUserStatus = this.currentStatus();
    this.getLocalPresence =
      BdApi.findModuleByProps("getLocalPresence").getLocalPresence;

    this.intervalId = setInterval(() => {
      for (const x in this.getLocalPresence().activities) {
        if (this.getLocalPresence().activities[x].name === SETTINGS.gameName) {
          this.updateStatus("dnd");
          this.found = true;
        }
      }
      if (!this.found) {
        this.updateStatus(this.currentUserStatus);
      }
      this.found = false;
    }, 10000);
  }

  stop() {
    clearInterval(this.intervalId);
    this.updateStatus(this.currentStatus());
  }

  buildSetting(text, key, type, value, callback = () => {}) {
    const setting = Object.assign(document.createElement("div"), {
      className: "setting",
    });
    const label = Object.assign(document.createElement("span"), {
      textContent: text,
    });
    const input = Object.assign(document.createElement("input"), {
      type: type,
      name: key,
      value: value,
    });
    input.addEventListener("change", () => {
      const newValue = input.value;
      SETTINGS[key] = newValue;
      BdApi.saveData(this.meta.name, "settings", SETTINGS);
      callback(newValue);
    });
    setting.append(label, input);
    return setting;
  }

  getSettingsPanel() {
    const SettingsPanel = document.createElement("div");
    SettingsPanel.id = "settings";

    const gameName = this.buildSetting(
      "Game Name",
      "gameName",
      "text",
      SETTINGS.gameName,
      this.updateButtonText
    );
    SettingsPanel.append(gameName);
    return SettingsPanel;
  }
};
