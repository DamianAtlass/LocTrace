/*!
thefragebogen
Version: 1.0.0
http://www.TheFragebogen.de
GIT: [object Object]/commit/08178a41690a19be4f18ac1f9acf6eb9c827a86a
License: MIT
Monday, June 13th, 2022, 10:50:30 PM UTC
*/
/**
Triggers a download of `data` using the provided filename.
Encapulates some browser-specific API differences.


@param {string} filename The filename to use.
@param {string} data The data to be saved.
@returns {undefined}
*/

function downloadData(filename, data) {
    if (typeof(window.navigator.msSaveBlob) === "function") {
        const blob = new Blob([data], {
            type: "text/plain"
        });
        window.navigator.msSaveBlob(blob, filename);
        return;
    }
    if ("download" in document.createElement("a") && navigator.userAgent.toLowerCase().indexOf("firefox") === -1) { //So far only chrome AND not firefox.
        const downloadLink = document.createElement("a");
        downloadLink.download = filename;
        downloadLink.href = window.URL.createObjectURL(new Blob([data], {
            type: "text/plain"
        }));
        downloadLink.click();
        window.URL.revokeObjectURL(downloadLink.href); //Release object: https://developer.mozilla.org/en-US/docs/Web/API/URL.revokeObjectURL
        return;
    }
    window.location.href = "data:application/x-download;charset=utf-8," + encodeURIComponent(data);
}

/**
Defines a message that should be logged, consisting of level, location, and the content.
The messages _should_ be subdivided in five types according to their relevance:
1. Fatal
2. Error
3. Warn
4. Info
5. Debug

DEVELOPER: This class is used internally by LogConsole and should not be accessed directly.

@class LogMessage
*/
class LogMessage {

    /**
    @param {string} logLevel type of message
    @param {string} location location in the code
    @param {string} msg the message itself
    */
    constructor(logLevel, location, msg) {
        this.logLevel = "" + logLevel;
        this.location = "" + location;
        this.msg = msg;
    }
}

/**
Provides basic logging functionality (prints to console).

DEVELOPER: All the messages (instances of class `LogMessage`) are saved in an array and can be accessed via `TheFragebogen.logger.logMessages` as long as this logger is used.

@class LogConsole
*/
class LogConsole {

    constructor() {
        this.logMessages = [];
        this.debug("LogConsole.constructor()", "Start");
    }

    debug(location, msg) {
        this.logMessages.push(new LogMessage("DEBUG", location, msg));
        if (console.debug === undefined) {
            //For IE console.debug is not defined.
            console.debug = console.log;
        }
        console.debug("DEBUG: " + location + ": " + msg);
    }

    info(location, msg) {
        this.logMessages.push(new LogMessage("INFO", location, msg));
        console.info("INFO: " + location + ": " + msg);
    }

    warn(location, msg) {
        this.logMessages.push(new LogMessage("WARN", location, msg));
        console.warn("WARN: " + location + ": " + msg);
    }

    error(location, msg) {
        this.logMessages.push(new LogMessage("ERROR", location, msg));
        console.error("ERROR: " + location + ": " + msg);
    }

    fatal(location, msg) {
        this.logMessages.push(new LogMessage("FATAL", location, msg));
        console.error("FATAL: " + location + ": " + msg);
    }
}

/**
 Defines the accessor for the logger.
 Can be redefined later if desired.
*/
const TheFragebogen = {
    logger: new LogConsole()
};

/**
Provides a UI for pagination between `Screens`.
Only provides a set of API that must be implemented by childs.

@abstract
@class PaginateUI
*/
class PaginateUI {

    /**
    @param {string} [className] CSS class
    */
    constructor(className) {
        this.className = className;

        this.paginateCallback = null;
    }

    /**
    Creates the UI of the element.
    @abstract
    @return {object}
    */
    createUI() {
        TheFragebogen.logger.debug(this.constructor.name + ".createUI()", "This method must be overridden.");
    }

    /**
    Destroys the UI.
    @abstract
    */
    releaseUI() {
        TheFragebogen.logger.debug(this.constructor.name + ".releaseUI()", "This method might need to be overridden.");
    }

    /**
    Sets callback to get informed when loading of all required external data is finished.
    @param {Function}
    @return {boolean}
    */
    setPaginateCallback(paginateCallback) {
        if (!(paginateCallback instanceof Function)) {
            TheFragebogen.logger.error(this.constructor.name + ".setPaginateCallback()", "No callback handle given.");
            return false;
        }

        TheFragebogen.logger.debug(this.constructor.name + ".setPaginateCallback()", "called");
        this.paginateCallback = paginateCallback;
        return true;
    }

    /**
    Sends this.paginateCallback() to paginate to the desired Screen.
    @param {Number} relativeScreenId The screen to paginate to as relative index.
    @return {boolean}
    */
    _sendPaginateCallback(relativeScreenId) {
        if (!(this.paginateCallback instanceof Function)) {
            TheFragebogen.logger.warn(this.constructor.name + "._sendPaginateCallback()", "called, but no paginateCallback set.");
            return false;
        }
        this.paginateCallback(relativeScreenId);
    }

    /**
    @return {string} Returns a string representation of this object.
    @abstract
    */
    toString() {
        TheFragebogen.logger.debug(this.constructor.name + ".toString()", "This method might need to be overridden.");
    }
}

/**
A Screen is a UI component that shows a UI.
It represents a sheet of paper containing several items of a questionnaire.
In TheFragebogen only one screen is shown at a time.

@abstract
@class Screen
*/
class Screen {

    /**
    @param {string} [className] CSS class
    */
    constructor(className) {
        this.className = className;

        this.paginateCallback = null;
        this.preloadedCallback = null;
        this.preloaded = true;

        this.node = null;
    }

    /**
    @returns {boolean} true if the UI is created, false if not
    */
    isUIcreated() {
        return this.node !== null;
    }

    /**
    Creates the UI.
    @abstract
    */
    createUI() {}

    /**
    Applies the set className.
    Usually called during createUI().
    */
    applyCSS() {
        if (this.isUIcreated() && this.className !== undefined) {
            this.node.className = this.className;
        }
    }

    /**
    (optional) Inform the screen its UI gets shown.
    @abstract
    */
    start() {}

    /**
    Destroy and release the UI.
    */
    releaseUI() {
        TheFragebogen.logger.info(this.constructor.name + ".releaseUI()", "");
        this.node = null;
    }

    /**
    Returns the stored data.
    @abstract
    @returns {array<array>}
    */
    getData() {}

    /**
    Set the callback for ready-state changed.
    @param {function} [callback]
    */
    setPaginateCallback(callback) {
        if (!(callback instanceof Function)) {
            TheFragebogen.logger.error(this.constructor.name + ".setPaginateCallback()", "Provided callback ist not a function.");
            return false;
        }

        TheFragebogen.logger.debug(this.constructor.name + ".setPaginateCallback()", "called.");
        this.paginateCallback = callback;
        return true;
    }

    /**
    Call this.paginateCallback().
    @param {number} [relativeScreenId=1] The relative id of the next screen.
    @param {boolean} [isReadyRequired=true] Only send the event if `this.isReady() === true`.
    */
    _sendPaginateCallback(relativeScreenId, isReadyRequired) {
        relativeScreenId = relativeScreenId === undefined ? 1 : relativeScreenId;
        isReadyRequired = isReadyRequired === undefined ? true : isReadyRequired;

        if (!(this.paginateCallback instanceof Function)) {
            TheFragebogen.logger.error(this.constructor.name + "._sendPaginateCallback()", "called, but no paginateCallback set.");
            return;
        }

        if (isReadyRequired && !this.isReady()) {
            TheFragebogen.logger.info(this.constructor.name + "._sendPaginateCallback()", "called while screen is not ready but isReadyRequired is set.");
            return;
        }

        TheFragebogen.logger.debug(this.constructor.name + "._sendPaginateCallback()", "called");
        this.paginateCallback(this, relativeScreenId);
    }

    /**
    Is the screen ready and TheFragebogen can continue to the next one?
    @abstract
    @returns {boolean} true Is the screen ready?
    */
    isReady() {
        return true;
    }

    /**
    Sets the `PaginateUI` for the screen.
    NOTE: Can only be called successfully if `screen.createUI()` is `false`.
    NOTE: This function is _only_ implemented by screens that provide _manual_ pagination.
    @abstract
    @param {function} [paginateUI] Set the `PaginateUI` to be used. Set `null` for no `paginateUI`.
    @returns {boolean} Setting the PaginateUI was successful?
    */
    setPaginateUI(paginateUI) {
        TheFragebogen.logger.warn(this.constructor.name + ".setPaginateUI()", "This method might need to be overridden.");
        return false;
    }

    /**
    Starts preloading external media.
    Default implementation immediately sends callback `Screen._sendOnPreloadedCallback()`.
    @abstract
    */
    preload() {
        TheFragebogen.logger.debug(this.constructor.name + ".preload()", "Must be overridden for preloading.");
        this._sendOnPreloadedCallback();
    }

    /**
    All external resources loaded?
    @abstract
    @returns {boolean}
    */
    isPreloaded() {
        return this.preloaded;
    }

    /**
     Calls the function defined by setOnPreloadedCallback()
     */
    _sendOnPreloadedCallback() {
        if (!(this.preloadedCallback instanceof Function)) {
            TheFragebogen.logger.error(this.constructor.name + "._sendOnPreloadedCallback()", "called, but no preloadedCallback set.");
            return;
        }
        this.preloadedCallback();
    }

    /**
     Sets a preloadedCallback function to be called when screen preloading
     is finished.
     */
    setOnPreloadedCallback(preloadedCallback) {
        if (!(preloadedCallback instanceof Function)) {
            TheFragebogen.logger.error(this.constructor.name + ".setOnPreloadedCallback()", "No callback handle given.");
            return false;
        }

        TheFragebogen.logger.debug(this.constructor.name + ".setOnPreloadedCallback()", "called");
        this.preloadedCallback = preloadedCallback;
        return true;
    }
}

/**
A ScreenController coordinates a questionnaire, i.e., showing a set of Screens and storing the gathered data.
This ScreenController shows the Screens in a predefined order.
Applies lifecycle management for the Screens.

ATTENTION: `ScreenController.init(parentNode)` must be called before using a ScreenController.

Callbacks:
* ScreenController.callbackScreenFinished() {boolean}: The current screen is done; continue to next screen?

@class ScreenController
*/
class ScreenController {

    /**
    @param {array} The Screens to be used.
    */
    constructor() {
        if (arguments.length === 0) TheFragebogen.logger.fatal(this.constructor.name + ".constructor", "No screen available.");

        const localArguments = [].concat.apply([], arguments); //Flatten the potential array.

        for (let i = 0; i < localArguments.length; i++) {
            if (!(localArguments[i] instanceof Screen)) TheFragebogen.logger.error(this.constructor.name + "()", "This argument (index " + i + " is not a Screen: " + localArguments[i] + " and will be ignored.");
        }
        this.screen = [];
        const screenList = localArguments.filter((element) => element instanceof Screen);
        for (let i = 0; i < screenList.length; i++) {
            this.addScreen(screenList[i]);
        }

        this.callbackScreenFinished = null;

        this.currentScreenIndex = null;
        this.screenContainerNode = null;

        this.preloadedScreenResult = null;
    }

    /**
    Init this instance of ScreenController; most important providing the HTML element to be used.
    @param {HTMLElement} [parentNode] The parent HTML element; must be a container.
    */
    init(parentNode) {
        if (this.screenContainerNode !== null) {
            TheFragebogen.logger.warn(this.constructor.name + ".init()", "Is already initialized.");
            return;
        }

        TheFragebogen.logger.debug(this.constructor.name + ".init()", "Start");

        this.screenContainerNode = parentNode;

        this.currentScreenIndex = 0;
    }

    setCallbackScreenFinished(callback) {
        if (!(callback instanceof Function)) {
            TheFragebogen.logger.warn(this.constructor.name + ".setCallbackScreenFinished()", "Callback is not a function. Ignoring it.");
            return;
        }
        this.callbackScreenFinished = callback;
    }

    /**
    Add an additional screen at the end.
    @param {Screen} screen
    @returns {number} The index of the just added screen; in case of failure -1.
    */
    addScreen(screen) {
        if (!(screen instanceof Screen)) {
            TheFragebogen.logger.warn(this.constructor.name + ".addScreen()", "This screen is not a screen. Ignoring it.");
            return -1;
        }

        TheFragebogen.logger.info(this.constructor.name + ".addScreen()", "Appending screen.");
        this.screen.push(screen);

        if (screen.setGetDataCallback instanceof Function) {
            screen.setGetDataCallback((includeAnswerChangelog) => this.requestDataCSV(includeAnswerChangelog));
        }
        if (screen.setGetRawDataCallback instanceof Function) {
            screen.setGetRawDataCallback((includeAnswerChangelog) => this.requestDataArray(includeAnswerChangelog));
        }
        if (screen.setPaginateCallback instanceof Function) {
            screen.setPaginateCallback((screen, relativeScreenId) => this.nextScreen(screen, relativeScreenId));
        }

        return this.screen.length - 1;
    }

    /**
     */

    /**
    Starts the screenController, i.e., showing the screen in their respective order.
    */
    start() {
        this.screenContainerNode.innerHTML = "";
        this._displayUI();
    }

    /**
    Proceeds to the next screen if the current screen reports ready.
    @param {Screen} screen The screen that send the callback.
    @param {number} [relativeScreenId=1]
    */
    nextScreen(screen, relativeScreenId) {
        if (this.screenContainerNode === null) {
            TheFragebogen.logger.error(this.constructor.name + ".nextScreen()", "Please call init() before.");
            return;
        }

        if (!(screen instanceof Screen)) {
            TheFragebogen.logger.error(this.constructor.name + ".nextScreen()", "Got a callback without a screen.");
            return;
        }

        if (screen !== this.screen[this.currentScreenIndex]) {
            TheFragebogen.logger.error(this.constructor.name + ".nextScreen()", "Got a callback from a different screen than the current one.");
            return;
        }

        if (this.callbackScreenFinished instanceof Function && !this.callbackScreenFinished(relativeScreenId)) { //Should we proceed to the next screen or is this handled by external command?
            return;
        }

        relativeScreenId = relativeScreenId === undefined ? 1 : relativeScreenId;
        this.goToScreenRelative(relativeScreenId);
    }

    _displayUI() {
        if (this.currentScreenIndex >= this.screen.length) {
            TheFragebogen.logger.error(this.constructor.name + "._displayUI()", "There is no screen with index " + this.currentScreenIndex + ".");
            return;
        }

        TheFragebogen.logger.info(this.constructor.name + "._displayUI()", "Displaying next screen with index: " + this.currentScreenIndex + ".");

        //Scroll back to top
        window.scrollTo(0, document.body.scrollLeft);

        //Add the new screen
        const screen = this.screen[this.currentScreenIndex];
        this.screenContainerNode.appendChild(screen.createUI());
        screen.start();
    }

    /**
    Prepare data for export (CSV).
    * Column 1: ScreenIndex
    * Column 2: Class
    * Column 3: Questions
    * Column 4: Answer options
    * Column 5: JSON.stringify(Answers || Answer changelog)
    @param {boolean} [includeAnswerChangelog=false] Should the the changelog of the answer be reported?
    @return {string}
    */
    requestDataCSV(includeAnswerChangelog) {
        TheFragebogen.logger.info(this.constructor.name + ".requestDataCSV()", "called.");
        const dataArray = this.requestDataArray(includeAnswerChangelog);

        let result = "";
        for (let i = 0; i < dataArray.length; i++) {
            result += '"' + dataArray[i][0]; //Screen index
            result += '","' + dataArray[i][1]; //Type of question
            result += '","' + dataArray[i][2]; //Question
            result += '","' + dataArray[i][3]; //Answer options
            result += '",' + JSON.stringify(dataArray[i][4]) + '\n'; //Answer
        }
        return result;
    }

    /**
    Prepare data for export as a two-dimensional array:
    * Column 1: ScreenIndex
    * Column 2: Class
    * Column 3: Questions
    * Column 4: Answer options
    * Column 5: Answers || Answer changelog
    @param {boolean} [includeAnswerChangelog=false] Should the the changelog of the answer be reported?
    @return {array}
    */
    requestDataArray(includeAnswerChangelog) {
        TheFragebogen.logger.info(this.constructor.name + ".requestDataArray()", "called.");

        let screenIndeces = ["Screen index"];
        let questionType = ["Type of item"];
        let questions = ["Question"];
        let options = ["Answer options"];
        let answers = ["Answer"];

        for (let i = 0; i <= this.currentScreenIndex; i++) {
            const currentData = this.screen[i].getData(includeAnswerChangelog);

            if (currentData instanceof Array && currentData[0] instanceof Array && currentData[1] instanceof Array && currentData[2] instanceof Array && currentData[3] instanceof Array) {
                if (currentData[0].length === 0) continue;

                if (currentData[1].length > currentData[3].length) {
                    TheFragebogen.logger.warn(this.constructor.name + ".requestDataArray()", "More items than answers - filling with null.");
                    currentData[1][currentData[0].length] = null;
                }

                for (let j = 0; j < currentData[0].length; j++) {
                    screenIndeces = screenIndeces.concat(i);
                }

                questionType = questionType.concat(currentData[0]);
                questions = questions.concat(currentData[1]);
                options = options.concat(currentData[2]);
                answers = answers.concat(currentData[3]);
            }
        }

        let result = [];
        for (let i = 0; i < screenIndeces.length; i++) {
            result[i] = [];
            result[i][0] = screenIndeces[i];
            result[i][1] = questionType[i];
            result[i][2] = questions[i];
            result[i][3] = options[i];
            result[i][4] = answers[i];
        }

        //Replace line breaks.
        result = result.map(function(line) {
            return line.map(function(cell) {
                return (typeof(cell) === "string") ? cell.replace(/\n/g, '\\n') : cell;
            });
        });

        return result;
    }

    /**
    @return {boolean}
    */
    isLastScreen() {
        return this.currentScreenIndex === this.screen.length - 1;
    }

    /*
    @return {number}
    */
    getCurrentScreenIndex() {
        return this.currentScreenIndex;
    }

    /*
    @return {Screen}
    */
    getCurrentScreen() {
        return this.screen[this.getCurrentScreenIndex()];
    }

    /**
    Go to screen by screenId (relative).
    @argument {number} relativeScreenId The screenId (relative) of the screen that should be displayed.
    @return {boolean} Success.
    */
    goToScreenRelative(relativeScreenId) {
        if (this.screenContainerNode === null) {
            TheFragebogen.logger.error(this.constructor.name + ".goToScreenRelative()", "Please call init() before.");
            return false;
        }

        if (this.getCurrentScreenIndex() == this.screen.length - 1 && relativeScreenId == 1) {
            TheFragebogen.logger.warn(this.constructor.name + ".goToScreenRelative()", "Reached the last screen and there is no next screen to proceed to.");
            return false;
        }

        const screenId = this.getCurrentScreenIndex() + relativeScreenId;

        if (!(0 <= screenId && screenId < this.screen.length)) {
            TheFragebogen.logger.error(this.constructor.name + ".goToScreenRelative()", "There is no screen with id: " + screenId);
            return false;
        }

        this.screen[this.currentScreenIndex].releaseUI();
        this.screenContainerNode.innerHTML = null;

        this.currentScreenIndex = screenId;
        this._displayUI();
        return true;
    }

    /**
    Go to screen by screenId (absolute).
    @argument {number} screenId The screenId (relative) of the screen that should be displayed.
    @return {boolean} Success.
    */
    goToScreenAbsolute(screenId) {
        return this.goToScreenRelative(screenId - this.getCurrentScreenIndex());
    }

    /**
    Initiates preloading of external media, i.e., informs all `Screens` to start loading external media and report when ready/fail.
    While preloading, `screenController.start()` can be called.
    @see ScreenController._onPreloadedScreenFinished()
    @see ScreenController._onScreenPreloaded()
    @see ScreenController._finishedPreload()
    @param innerHTML The HTML to be shown while preloading.
    */
    preload(innerHTML) {
        TheFragebogen.logger.debug(this.constructor.name + ".preload()", "Preloading started.");

        this.screenContainerNode.innerHTML += innerHTML;

        for (let i = 0; i < this.screen.length; i++) {
            this.screen[i].setOnPreloadedCallback(() => this.onScreenPreloaded());
            this.screen[i].preload();
        }
    }

    /**
    Handles the returned preloadStatus from each screen.
    @param {Screen} screen The screen that finished preloading.
    */
    onScreenPreloaded() {
        for (let i = 0; i < this.screen.length; i++) {
            if (!this.screen[i].isPreloaded()) {
                return;
            }
        }

        this.onPreloadingDone();
    }

    /**
    Preloading is finished.
    Start the screenController.
    */
    onPreloadingDone() {
        TheFragebogen.logger.info(this.constructor.name + "._onPreloadingDone()", "Preloading done. Let's go.");
        setTimeout(() => this.start(), 2000);
        //TODO Do something about preloading errors?
    }
}

/**
Abstract controller class for generic UI elements.
Only provides a set of API that must be implemented by childs.

@abstract
@class UIElement
*/
class UIElement {

    /**
    @param {string} [className] CSS class
    */
    constructor(className) {
        this.className = className;

        this.uiCreated = false;
        this.enabled = false;
        this.visible = true;
        this.preloaded = true;

        this.preloadedCallback = null;
        this.node = null;
    }

    /**
    @returns {boolean} true if the UI is created, false if not
    */
    isUIcreated() {
        return this.uiCreated;
    }

    /**
    Creates the UI of the element.
    @abstract
    @return {object}
    */
    createUI() {
        TheFragebogen.logger.debug(this.constructor.name + ".createUI()", "This method must be overridden.");
    }

    /**
    Applies the set className.
    Usually called during createUI().
    @param {string} cssSuffix A suffix to be added to this.className.
    */
    applyCSS(cssSuffix) {
        if (this.isUIcreated() && (this.className !== undefined || cssSuffix !== undefined)) {
            let newClassName = "";
            newClassName += this.className !== undefined ? this.className : "";
            newClassName += cssSuffix !== undefined ? cssSuffix : "";
            this.node.className = newClassName;
        }
    }

    /**
    Destroys the UI.
    */
    releaseUI() {
        this.uiCreated = false;
        this.enabled = false;
        this.node = null;
    }

    /**
    @return {boolean} Is the UI of this element enabled?
    */
    isEnabled() {
        return this.enabled;
    }

    /**
    Setting a component to be enabled incl. UI components.
    By default disables all childs of this.node.
    @param {boolean} enabled
    */
    setEnabled(enable) {
        if (!this.isUIcreated()) {
            return;
        }
        this.enabled = enable;

        if (this.node !== null) {
            const elements = this.node.getElementsByTagName("*");
            for (let i = 0; i < elements.length; i++) {
                elements[i].disabled = !this.enabled;
            }
        }
    }

    /**
    @return {boolean} Is the UI of this element visible?
    */
    isVisible() {
        return this.visible;
    }

    /**
    Set UI visible state.
    @param {boolean} visible
    */
    setVisible(visible) {
        if (!this.isUIcreated()) return;

        this.visible = visible;
        this.node.style.visibility = visible ? "visible" : "hidden";
    }


    /**
    @returns {string} The type of this class usually the name of the class.
    */
    getType() {
        return this.constructor.name;
    }

    /**
    @abstract
    @return {boolean} Is the element ready?
    */
    isReady() {
        TheFragebogen.logger.debug(this.constructor.name + ".isReady()", "This method might need to be overridden.");
        return true;
    }

    /**
    Starts preloading external media.
    Default implementation immedately sends callback `Screen._sendOnScreenPreloadedCallback()`.
    @abstract
    */
    preload() {
        TheFragebogen.logger.debug(this.constructor.name + ".preload()", "Must be overridden for preloading.");
        this._sendOnPreloadedCallback();
    }

    /**
    All external resources loaded?
    @returns {boolean}
    */
    isPreloaded() {
        return this.preloaded;
    }

    /**
    Set callback to get informed when loading of all required external data is finished.
    @param {Function}
    @return {boolean}
    */
    setOnPreloadedCallback(preloadedCallback) {
        if (!(preloadedCallback instanceof Function)) {
            TheFragebogen.logger.error(this.constructor.name + ".setOnPreloadedCallback()", "No callback handle given.");
            return false;
        }

        TheFragebogen.logger.debug(this.constructor.name + ".setOnPreloadedCallback()", "called");
        this.preloadedCallback = preloadedCallback;
        return true;
    }

    /**
    Sends this.onPreloadCallback() to signalize that all required data could be loaded.
    @return {boolean}
    */
    _sendOnPreloadedCallback() {
        if (!(this.preloadedCallback instanceof Function)) {
            TheFragebogen.logger.warn(this.constructor.name + "._sendOnPreloadedCallback()", "called, but no onScreenPreloadedCallback set.");
            return false;
        }
        this.preloaded = true;
        this.preloadedCallback();
    }

    /**
    @abstract
    @return {string} Returns a string representation of this object.
    */
    toString() {
        TheFragebogen.logger.debug(this.constructor.name + ".toString()", "This method might need to be overridden.");
    }
}

 /**
Provides a UI for pagination between `Screens`.

Implements a button to continue to the following `Screen`.

@class PaginateUIButton
@augments PaginateUI
*/
 class PaginateUIButton extends PaginateUI {

     /**
     @param {string} [className] CSS class
     @param {number} [relativeIdNext=undefined] The relativeId of the next screen. If undefined, no back button will be generated.
     @param {number} [relativeIdback=undefined] The relativeId of the next screen. If undefined, no back button will be generated.
     @param {string} [labelBack="Back"] The caption for the back-button.
     @param {string} [labelNext="Next"] The caption for the next-button.
     */
     constructor(className, relativeIdBack, relativeIdNext, labelBack, labelNext) {
         super(className);

         this.relativeIdBack = relativeIdBack;
         this.relativeIdNext = relativeIdNext;
         if (this.relativeIdBack === undefined && this.relativeIdNext === undefined) {
             TheFragebogen.logger.error(this.constructor.name + "()", "relativeIdBack and relativeIdNext are undefined. No buttons will be created.");
         }
         if (typeof(this.relativeIdBack) !== "number" && typeof(this.relativeIdNext) !== "number") {
             TheFragebogen.logger.error(this.constructor.name + "()", "relativeIdBack and relativeIdNext should be numbers.");
         }

         this.labelBack = labelBack === undefined ? "Back" : labelBack;
         this.labelNext = labelNext === undefined ? "Next" : labelNext;

         this.node = null;
     }

     /**
     @returns {boolean} true if the UI is created, false if not
     */
     isUIcreated() {
         return this.uiCreated;
     }

     createUI() {
         this.node = document.createElement("div");
         this.node.className = this.className;

         if (this.relativeIdBack !== undefined) {
             const buttonBack = document.createElement("input");
             buttonBack.type = "button";
             buttonBack.value = this.labelBack;
             buttonBack.addEventListener("click", () => this._sendPaginateCallback(this.relativeIdBack));
             this.node.appendChild(buttonBack);
         }

         if (this.relativeIdNext !== undefined) {
             const buttonNext = document.createElement("input");
             buttonNext.type = "button";
             buttonNext.value = this.labelNext;
             buttonNext.addEventListener("click", () => this._sendPaginateCallback(this.relativeIdNext));
             this.node.appendChild(buttonNext);
         }
         return this.node;
     }

     releaseUI() {
         this.node = null;
     }
 }

/**
A screen that shows all data that is _currently_ stored by the ScreenController.

Reports nothing.

Supports _pagination_.
Default paginator is `PaginateUIButton`.

@class ScreenDataPreview
@augments Screen
*/
class ScreenDataPreview extends Screen {

    /**
    @param {string} [className] CSS class
    @param {boolean} [includeAnswerChangelog=false] Should the the changelog of the answer be reported?
    */
    constructor(className, includeAnswerChangelog) {
        super(className);

        this.includeAnswerChangelog = includeAnswerChangelog;

        this.data = null;
        this.className = className;

        this.getDataFromScreencontroller = null;

        this.paginateUI = new PaginateUIButton(undefined, undefined, 1);
    }

    setPaginateUI(paginateUI) {
        if (this.isUIcreated()) return false;
        if (!(paginateUI instanceof PaginateUI || paginateUI === null)) return false;

        this.paginateUI = paginateUI;
        TheFragebogen.logger.debug(this.constructor.name + ".setPaginateUI()", "Set paginateUI.");
        return true;
    }

    createUI() {
        //Request data
        if (this.getDataFromScreencontroller instanceof Function) {
            TheFragebogen.logger.debug(this.constructor.name + "._sendGetDataFromScreencontroller()", "called");
            this.data = this.getDataFromScreencontroller(this.includeAnswerChangelog);
        }

        this.node = document.createElement("div");
        this.node.innerHTML = "<h1>Data Preview</h1>";
        this.applyCSS();

        const tblBody = document.createElement("tbody");
        for (let i = 0; i < this.data.length; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < this.data[i].length; j++) {

                const cell = document.createElement(i == 0 ? "th" : "td");

                cell.innerHTML = this.data[i][j];
                row.appendChild(cell);
            }
            tblBody.appendChild(row);
        }

        const tbl = document.createElement("table");
        tbl.appendChild(tblBody);
        this.node.appendChild(tbl);

        if (this.paginateUI != null) {
            this.paginateUI.setPaginateCallback((relativeScreenId) => this._sendPaginateCallback(relativeScreenId));
            this.node.appendChild(this.paginateUI.createUI());
        }

        return this.node;
    }

    releaseUI() {
        super.releaseUI();
        this.data = null;
    }

    /**
    Set the function pointer for requesting the ScreenController's _raw_ data.
    @param {function} function
    @returns {boolean} true if parameter was a function
    */
    setGetRawDataCallback(getDataFromScreencontroller) {
        if (getDataFromScreencontroller instanceof Function) {
            TheFragebogen.logger.debug(this.constructor.name + ".setGetRawDataCallback()", "called");
            this.getDataFromScreencontroller = getDataFromScreencontroller;
            return true;
        }
        return false;
    }
}

/**
A screen that shows an iFrame.
Ready is reported after the defined threshold of URL changes occured.

Reports the final URL.
Reports the time between ScreenIFrame.start() and the final URL change, i.e., the one that lead to ready.
ATTENTION: This might be misleading depending on your timing requirements!

ATTENTION: Preloading is not supported.

@class ScreenIFrame
@augments Screen
*/
class ScreenIFrame extends Screen {

    /**
    @param {string} [className] CSS class
    @param {string} [url]
    @param {number} [urlChangesToReady] Number of URL changes until ready is reported.
    */
    constructor(className, url, urlChangesToReady) {
        super(className);

        this.startTime = null;
        this.duration = null;

        this.urlStart = url;
        this.urlFinal = null;

        this.urlChanges = -1;
        this.urlChangesToReady = !isNaN(urlChangesToReady) && urlChangesToReady > 1 ? urlChangesToReady : 1;

        TheFragebogen.logger.debug(this.constructor.name + "()", "Set: url as " + this.urlStart + ", urlChangesToReady as" + this.urlChangesToReady);
    }

    createUI() {
        this.urlChanges = -1; //Ignore the first load
        this.node = document.createElement("iframe");
        this.applyCSS();

        this.node.src = this.urlStart;

        this.node.addEventListener("load", event => this._onFrameLoad(event));

        return this.node;
    }

    _onFrameLoad(event) {
        this.urlChanges += 1;

        TheFragebogen.logger.debug(this.constructor.name + ".iframe.onload()", this.urlStartChanges + " of " + this.maxUrlChanges + " viewed.");

        if (this.urlChanges >= this.urlChangesToReady) {
            this.duration = Date.now() - this.startTime;
            this.urlChanges = 0;

            try {
                this.urlFinal = event.target.contentWindow.location.href;
            } catch (error) {
                TheFragebogen.logger.warn(this.constructor.name + ".iframe.onload()", "TheFragebogen-Error: Could not get urlFinal from iFrame. Security limitation?");
                this.urlFinal = "TheFragebogen-Error: Could not get urlFinal of the iframe. Security limitation?";
            }
            this._sendPaginateCallback();
        }
    }

    start() {
        this.startTime = Date.now();
    }

    isReady() {
        return this.duration !== null;
    }

    releaseUI() {
        super.releaseUI();
        this.startTime = null;
    }

    getData() {
        return [
            ["url", "finalURL", "duration"],
            ["url", "finalURL", "duration"],
            ["", "", ""],
            [this.urlStart, this.urlFinal, this.duration]
        ];
    }
}

/**
A screen that presents one or more UIElements.
All UIElements are visible and enabled by default.
Ready is reported when all UIElements reported ready AND the user pressed the presented button.

Supports _pagination_.
Default paginator is `PaginateUIButton`.

@class ScreenUIElements
@augments Screen
*/
class ScreenUIElements extends Screen {

    /**
    @param {string} [className=] CSS class
    @param {...UIElement} arguments an array containing the UIElements of the screen
    */
    constructor(className) {
        super();

        const localArguments = Array.prototype.slice.call(arguments);

        if (className instanceof String) {
            this.className = className;
            localArguments.splice(0, 1);
        }

        for (let i = 0; i < localArguments.length; i++) {
            if (!(localArguments[i] instanceof UIElement)) {
                TheFragebogen.logger.error(this.constructor.name + "()", "This argument (index " + i + " is not an UIElement: " + localArguments[i]);
            }
        }
        this.uiElements = localArguments.filter((element) => element instanceof UIElement);

        if (this.uiElements.length < 1) {
            TheFragebogen.logger.error(this.constructor.name + "()", "No UIElements were passed to constructor.");
        }

        this.paginateUI = new PaginateUIButton(undefined, undefined, 1);
    }

    setPaginateUI(paginateUI) {
        if (this.isUIcreated()) return false;
        if (!(paginateUI instanceof PaginateUI || paginateUI === null)) return false;

        this.paginateUI = paginateUI;
        TheFragebogen.logger.debug(this.constructor.name + ".setPaginateUI()", "Set paginateUI.");
        return true;
    }

    createUI() {
        this.node = document.createElement("div");
        this.applyCSS();

        for (let i = 0; i < this.uiElements.length; i++) {
            if (this.uiElements[i].createUI === undefined) {
                TheFragebogen.logger.warn(this.constructor.name + ".createUI()", "Element[" + i + "] has no 'createUI' method");
                continue;
            }

            const uiElementNode = this.uiElements[i].createUI();
            if (uiElementNode instanceof HTMLElement) {
                this.node.appendChild(uiElementNode);
            } else {
                TheFragebogen.logger.warn(this.constructor.name + ".createUI()", "Element[" + i + "].createUI() did not a HTMLElement.");
            }
        }

        if (this.paginateUI != null) {
            this.paginateUI.setPaginateCallback((relativeScreenId) => this._sendPaginateCallback(relativeScreenId));
            this.node.appendChild(this.paginateUI.createUI());
        }

        return this.node;
    }

    releaseUI() {
        super.releaseUI();
        for (let i = 0; i < this.uiElements.length; i++) {
            this.uiElements[i].releaseUI();
        }
    }

    /**
    Enables all the elements of the screen.
    */
    start() {
        TheFragebogen.logger.info(this.constructor.name + ".start()", "");

        for (let i = 0; i < this.uiElements.length; i++) {
            this.uiElements[i].setEnabled(true);
        }
    }

    /**
    Are all UIElementInteractive ready?
    @returns {boolean}
    */
    isReady() {
        let ready = true;

        for (let i = 0; i < this.uiElements.length; i++) {
            if (this.uiElements[i] instanceof UIElementInteractive) {
                if (!this.uiElements[i].isReady()) {
                    ready = false;
                }
                this.uiElements[i].markRequired();
            }
        }
        return ready;
    }

    /**
     Returns the data of QuestionnaireItem (UIElementInteractive are omitted) as an two-dimensional array.
     The data of each questionnaire item is subdivided in 4 columns:
     1. QuestionnaireItem.getType()
     2. QuestionnaireItem.getQuestion()
     3. QuestionnaireItem.getAnswerOptions()
     4. QuestionnaireItem.getAnswer() || QuestionnaireItem.getAnswerChangelog()
     @param {boolean} includeAnswerChangelog Should the the changelog of the answer be reported?
     @returns {array}
     */
    getData(includeAnswerChangelog) {
        const data = [
            [],
            [],
            [],
            []
        ];

        for (let i = 0; i < this.uiElements.length; i++) {
            if ((this.uiElements[i] instanceof QuestionnaireItem)) {
                data[0].push(this.uiElements[i].getType());
                data[1].push(this.uiElements[i].getQuestion());
                data[2].push(this.uiElements[i].getAnswerOptions());
                if (includeAnswerChangelog) {
                    data[3].push(this.uiElements[i].getAnswerChangelog());
                } else {
                    data[3].push(this.uiElements[i].getAnswer());
                }
            }
        }
        return data;
    }

    preload() {
        TheFragebogen.logger.debug(this.constructor.name + ".preload()", "called");

        for (let i = 0; i < this.uiElements.length; i++) {
            this.uiElements[i].setOnPreloadedCallback(() => this._onUIElementPreloaded());
            this.uiElements[i].preload();
        }
    }

    /**
    All external resources loaded?
    @abstract
    @returns {boolean}
    */
    isPreloaded() {
        for (let i = 0; i < this.uiElements.length; i++) {
            if (!this.uiElements[i].isPreloaded()) return false;
        }
        return true;
    }

    _onUIElementPreloaded() {
        for (let i = 0; i < this.uiElements.length; i++) {
            if (!this.uiElements[i].isPreloaded()) return;
        }

        this._sendOnPreloadedCallback();
    }
}

/**
A screen that waits for the defined duration while presenting a message.
Fancy animation(s) can be shown using CSS.

@class ScreenWait
@augments Screen
*/
class ScreenWait extends Screen {

    /**
    @param {string} [className] CSS class
    @param {number} [time=2] The time to wait in seconds
    @param {string} [html="Please wait..."] The HTML content to be presented.
    */
    constructor(className, time, html) {
        super(className);

        this.time = !isNaN(time) ? Math.abs(time) * 1000 : 2;
        this.html = typeof(html) === "string" ? html : "Please wait...";

        this.timeoutHandle = null;
        this.readyCallback = null;

        TheFragebogen.logger.debug(this.constructor.name, "Set: time as " + this.time + " and html as " + this.html);
    }

    createUI() {
        this.node = document.createElement("div");
        this.node.innerHTML = this.html;
        this.applyCSS();

        return this.node;
    }

    _startTimer() {
        TheFragebogen.logger.info(this.constructor.name + "._startTimer()", "New screen will be displayed in " + this.time + "ms.");
        this.timeoutHandle = setTimeout(() => this._onWaitTimeReached(), this.time);
    }

    /**
    Starts the timer.
    */
    start() {
        this._startTimer();
    }

    _onWaitTimeReached() {
        this._sendPaginateCallback();

    }
    releaseUI() {
        super.releaseUI();
        clearTimeout(this.timeoutHandle);
        this.timeoutHandle = null;
    }
}

/**
A UIElement that shows a button.
The provided callback function gets called if a onclick event occurs on this button.

@class UIElementButton
@augments UIElement
*/
class UIElementButton extends UIElement {

    /**
    @param {string} [className] CSS class
    @param {string} caption Caption of the button
    @param {method} actionCallback Callback function for onclick event
    */
    constructor(className, caption, actionCallback) {
        super(className);

        this.caption = caption;
        this.actionCallback = actionCallback;
    }

    createUI() {
        this.node = document.createElement("div");
        this.uiCreated = true;
        this.applyCSS();

        const button = document.createElement("button");
        button.innerHTML = this.caption;
        button.addEventListener("click", () => this._onClick());

        this.node.appendChild(button);

        return this.node;
    }

    _onClick() {
        if (this.actionCallback) {
            this.actionCallback();
        }
    }
}

/**
A UIElement that shows non-interactive UI, i.e., plain HTML.
Provided HTML is encapsulated into a div and div.className is set.

@class UIElementHTML
@augments UIElement

*/
class UIElementHTML extends UIElement {
    /**
    @param {string} [className] CSS class
    @param {string} html HTML
    */
    constructor(className, html) {
        super(className);

        this.html = html;
    }

    createUI() {
        this.node = document.createElement("div");
        this.node.innerHTML = this.html;
        this.uiCreated = true;

        this.applyCSS();

        return this.node;
    }
}

/**
A UIElement that has an interactive UI and thus might not be ready in the beginning but requiring user interaction before its goal is fulfilled.

@abstract
@class UIElementInteractive
@augments UIElement
*/
class UIElementInteractive extends UIElement {

    /**
    @param {string} [className] CSS class
    */
    constructor(className) {
        super(className);
        this.enabled = false;
        this.onReadyStateChanged = null;
    }

    setOnReadyStateChangedCallback(onReadyStateChanged) {
        if (onReadyStateChanged instanceof Function) {
            TheFragebogen.logger.debug(this.constructor.name + ".setOnReadyStateChangedCallback()", "called");
            this.onReadyStateChanged = onReadyStateChanged;
        } else {
            this.onReadyStateChanged = null;
        }
    }

    _sendReadyStateChanged() {
        if (this.onReadyStateChanged instanceof Function) {
            TheFragebogen.logger.debug(this.constructor.name + "._sendReadyStateChanged()", "called");
            this.onReadyStateChanged(this);
        }
    }

    /**
    Updates the UI to inform to reflect that this element is _yet_ not ready.
    @abstract
    */
    markRequired() {
        TheFragebogen.logger.debug(this.constructor.name + ".markRequired()", "This method should be overridden.");
    }
}

/**
A QuestionnaireItem is an abstract UIElementInteractive that consists of a question and presents a scale.
The answer on the scale is stored.

NOTE: An QuestionnaireItem that is not yet answered but required, will be marked on check with the CSS class: `className + "Required"`.

DEVERLOPER: Subclasses need to override `_createAnswerNode()`.

@abstract
@class QuestionnaireItem
@augments UIElement
@augments UIElementInteractive
*/
class QuestionnaireItem extends UIElementInteractive {

    /**
    @param {string} [className] CSS class
    @param {string} question question
    @param {boolean} [required=false] Is this QuestionnaireItem required to be answered?
    */
    constructor(className, question, required) {
        super(className);

        this.question = question;
        this.required = required;
        this.answerLog = []; //will store [[Date, answer]...]

        TheFragebogen.logger.debug(this.constructor.name + "()", "Set: className as " + this.className + ", question as " + this.question + " and required as " + this.required);
    }

    /**
    Returns the question.
    @returns {string} The question.
    */
    getQuestion() {
        return this.question;
    }

    /**
    Returns the answer (most recent set).
    @returns {object} The answer.
    */
    getAnswer() {
        if (this.answerLog.length === 0) {
            return null;
        }
        return this.answerLog[this.answerLog.length - 1][1];
    }

    /**
    Returns a copy of the changelog of answers (as generated by `this.setAnswer()`).
    @returns {array<Date, object>} The changelog of answers.
    */
    getAnswerChangelog() {
        return this.answerLog.slice();
    }

    /**
    Sets the answer and adds it to this.answerLog.
    @param {object} answer The answer to be set.
    @returns {boolean} Success or failure.
    */
    setAnswer(answer) {
        this.answerLog.push([new Date(), answer]);
        this._sendReadyStateChanged();
        return true;
    }

    /**
    Is this QuestionnaireItem answered?
    @returns {boolean}
    */
    isAnswered() {
        return this.answerLog.length > 0 && this.answerLog[this.answerLog.length - 1][1] !== null;
    }

    /**
    Returns the list of predefined options.
    @abstract
    @returns {array} undefined by default.
    */
    getAnswerOptions() {
        return undefined;
    }

    /**
    Adjust the UI if the answer was changed using `setAnswer()`.
    @abstract
    */
    applyAnswerToUI() {
        TheFragebogen.logger.debug(this.constructor.name + ".applyAnswerToUI()", "This method might need to be overridden.");
    }

    /**
    Is this QuestionnaireItem ready, i.e., answered if required?
    @returns {boolean}
    */
    isReady() {
        return this.isRequired() ? this.isAnswered() : true;
    }

    /**
    Is this QuestionnaireItem required to be answered?
    @returns {boolean}
    */
    isRequired() {
        return this.required;
    }

    createUI() {
        this.uiCreated = true;

        this.node = document.createElement("div");
        this.applyCSS();

        this.node.appendChild(this._createQuestionNode());
        this.node.appendChild(this._createAnswerNode());

        this.applyAnswerToUI();

        return this.node;
    }

    /**
    Create the UI showing the question.
    @returns {HTMLElement} The div containing the question.
    */
    _createQuestionNode() {
        const questionNode = document.createElement("div");
        questionNode.innerHTML = this.question + (this.required ? "*" : "");
        return questionNode;
    }

    /**
    Create the UI showing the scale.
    @abstract
    @returns {HTMLElement} The HTML container with the scale.
    */
    _createAnswerNode() {
        TheFragebogen.logger.warn(this.constructor.name + "._createAnswerNode()", "This method might need to be overridden.");
    }

    releaseUI() {
        super.releaseUI();
    }

    /**
    Mark this element as required if it was not answered (className + "Required").
    Is called by the Screen if necessary.
    */
    markRequired() {
        if (this.node === null) {
            return;
        }

        const classNameRequired = (this.className !== undefined ? this.className : "") + "Required";
        if (!this.isReady()) {
            this.node.classList.add(classNameRequired);
        } else {
            this.node.classList.remove(classNameRequired);
        }
    }
}

/**
A screen that presents one or more UIElements and reports ready _automatically_ when all UIElements are ready.
All UIElements are visible and enabled by default.

NOTE: UIElementsInteractive should be marked as REQUIRED.

@class ScreenUIElementsAuto
@augments Screen
@augments ScreenUIElements
*/
class ScreenUIElementsAuto extends ScreenUIElements {
    /**
    @param {string} [className=] CSS class
    @param {...UIElement} arguments an array containing the UIElements of the screen
    */
    constructor(...args) {
        super(...args);
    }

    createUI() {
        this.node = document.createElement("div");
        this.applyCSS();

        for (let i = 0; i < this.uiElements.length; i++) {
            if (!(this.uiElements[i] instanceof UIElement)) {
                TheFragebogen.logger.warn(this.constructor.name + ".createUI()", "Element[" + i + "] has no 'createUI' method");
                continue;
            }

            const uiElementNode = this.uiElements[i].createUI();
            if (uiElementNode instanceof HTMLElement) {
                this.node.appendChild(uiElementNode);
            } else {
                TheFragebogen.logger.warn(this.constructor.name + ".createUI()", "Element[" + i + "].createUI() did not a HTMLElement.");
            }

            if (this.uiElements[i].setOnReadyStateChangedCallback instanceof Function) {
                this.uiElements[i].setOnReadyStateChangedCallback(() => this._onUIElementReady());
            }
        }

        return this.node;
    }

    _onUIElementReady() {
        if (this.isReady()) {
            this._sendPaginateCallback();
        }
    }

    setPaginateUI(paginateUI) {
        TheFragebogen.logger.warn(this.constructor.name + ".setPaginateUI()", "Does not support pagination.");
        return false;
    }
}

/**
A screen that presents one or more UIElements.
All UIElements are visible by default.
UIElements are enabled one after another, i.e., if its predecessing UIElement reported to be ready the next one is enabled.

@class ScreenUIElementsSequential
@augments Screen
@augments ScreenUIElements
*/
class ScreenUIElementsSequential extends ScreenUIElements {

    /**
    @param {string} [className=] CSS class
    @param {...UIElement} arguments an array containing the UIElements of the screen
    */
    constructor(...args) {
        super(...args);
        this.currentElementIndex = null;
    }

    start() {
        for (let i = 0; i < this.uiElements.length; i++) {
            if (this.uiElements[i] instanceof UIElementInteractive) {
                this.uiElements[i].setOnReadyStateChangedCallback(null);
            }
            this.uiElements[i].setEnabled(false);
            if (this.uiElements[i] instanceof UIElementInteractive) {
                this.uiElements[i].setOnReadyStateChangedCallback(() => this._onUIElementReady());
            }
        }

        for (let i = 0; i < this.uiElements.length; i++) {
            if (this.uiElements[i] instanceof UIElementInteractive) {
                this.currentElementIndex = i;
                this.uiElements[this.currentElementIndex].setEnabled(true);
                break;
            }
        }
        if (this.currentElementIndex == undefined) {
            TheFragebogen.logger.error(this.constructor.name + "", "One UIElementInteractive is at least required.");
        }
    }

    /**
    Callback to enable the following UIElementInteractive.
     */
    _onUIElementReady() {
        TheFragebogen.logger.info(this.constructor.name + "._onUIElementReady()", "called");

        let nextElementIndex = -1;
        for (let i = this.currentElementIndex + 1; i < this.uiElements.length; i++) {
            if (this.uiElements[i] instanceof UIElementInteractive) {
                nextElementIndex = i;
                break;
            }
            this.uiElements[i].setEnabled(true);
        }

        if (nextElementIndex === -1) {
            TheFragebogen.logger.warn(this.constructor.name + "._onUIElementReady()", "There is no next UIElement to enable left.");
            return;
        }

        this.uiElements[this.currentElementIndex].setEnabled(false);
        this.currentElementIndex = nextElementIndex;
        this.uiElements[this.currentElementIndex].setEnabled(true);
    }
}

/**
Base class of Screens that handle data export.
Displays a HTML message.

@abstract
@class ScreenWaitData
@augments Screen
@augments ScreenWait
*/
class ScreenWaitData extends ScreenWait {

    /**
    @param {string} [className=""] CSS class
    @param {number} time Time to wait in seconds
    @param {string} message The message to display (HTML)
    @param {boolean} [includeAnswerChangelog=false] Should the the changelog of the answer be reported?
    */
    constructor(className, time, message, includeAnswerChangelog) {
        super(className, time, message);

        this.data = null;
        this.includeAnswerChangelog = includeAnswerChangelog;

        this.getDataCallback = null;
    }

    setGetDataCallback(getDataCallback) {
        if (getDataCallback instanceof Function) {
            TheFragebogen.logger.debug(this.constructor.name + ".setGetDataCallback()", "called");
            this.getDataCallback = getDataCallback;
            return true;
        }
        return false;
    }

    _sendGetDataCallback() {
        if (this.getDataCallback instanceof Function) {
            TheFragebogen.logger.debug(this.constructor.name + "._sendGetDataCallback()", "called");
            this.data = this.getDataCallback(this.includeAnswerChangelog);
        }
    }
}

/**
Simulates the delayed loading of an image that is selectable (via checkbox).
During the load process a load animation (another image) is shown.

DEVELOPER:
* does not support preloading the images

@class UIElementInteractiveDelayedImageSelectable
@augments UIElement
@augments UIElementInteractive
*/
class UIElementInteractiveDelayedImageSelectable extends UIElementInteractive {

    /**
    @param {string} [className] CSS class
    @param {string} loadAnimationURL URL of the load animation.
    @param {string} imageURL URL of the image.
    @param {string} imageCaption The caption of the image.
    @param {float} loadDelay The delay in ms.
    @param {int} [readyMode=0] 0: immediately, 1: selected, 2: not selected, 3: ready on delayed load, 4: case 1 & 3; 5: case 2 & 3
    */
    constructor(className, loadAnimationURL, imageURL, imageCaption, imageDelay, readyMode) {
        super(className);

        this.loadAnimationURL = loadAnimationURL;
        this.imageURL = imageURL;
        this.imageCaption = imageCaption;
        this.imageDelay = imageDelay;

        this.isSelected = false;
        this.readyMode = [0, 1, 2, 3, 4, 5].indexOf(readyMode) === -1 ? 0 : readyMode;

        this.checkbox = null;
        this.isImageLoaded = false;
    }

    createUI() {
        this.node = document.createElement("span");
        this.uiCreated = true;
        this.applyCSS();

        this.checkbox = document.createElement("input");
        this.checkbox.type = "checkbox";
        this.node.appendChild(this.checkbox);
        //Apply value to UI
        this.checkbox.checked = this.isSelected;

        const image = new Image();
        image.alt = this.imageCaption;
        //Load delay for the image
        if (this.imageDelay > 0) {
            const imageURL = this.imageURL;
            image.src = this.loadAnimationURL;
            setTimeout(() => {
                    image.src = imageURL;
                    this.isImageLoaded = true;
                },
                this.imageDelay
            );
        } else {
            image.src = this.imageURL;
        }
        this.node.appendChild(image);

        image.addEventListener("click", (event) => this._onSelected(event));
        this.checkbox.addEventListener("changed", (event) => this._onSelected(event));
        this.node.addEventListener("click", (event) => this._onSelected(event));

        this.uiCreated = true;

        return this.node;
    }

    releaseUI() {
        super.releaseUI();

        this.checkbox = null;
        this.isImageLoaded = false;
    }

    isReady() {
        switch (this.readyMode) {
            case 0:
                return true;
            case 1:
                return this.isSelected;
            case 2:
                return this.isSelected === false;
            case 3:
                return this.isImageLoaded;
            case 4:
                return this.isImageLoaded && this.isSelected;
            case 5:
                return this.isImageLoaded && this.isSelected === false;
        }
    }

    _onSelected(event) {
        if (!this.isUIcreated()) return;

        if ([4, 5].indexOf(this.readyMode) != -1 && !this.isImageLoaded) return;

        this.isSelected = !this.isSelected;
        this.checkbox.checked = this.isSelected;

        event.stopPropagation();
    }
}

/**
A QuestionnaireItem with a HTML5 date selector.

@class QuestionnaireItemDate
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
*/
class QuestionnaireItemDate extends QuestionnaireItem {

    /**
    @param {string} [className] CSS class
    @param {string} [question]
    @param {boolean} [required=false]
    @param {string} [min] The earliest acceptable date.
    @param {string} [max] The lattest acceptable date.
    @param {string} [pattern] The pattern an acceptable date needs to fulfill.
    */
    constructor(className, question, required, min, max, pattern) {
        super(className, question, required);

        this.min = min;
        this.max = max;
        this.pattern = pattern;

        this.input = null;

        TheFragebogen.logger.debug(this.constructor.name + "()", "Set: min as " + this.min + ", max as " + this.max + " and pattern as " + this.pattern);
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        this.input = document.createElement("input");
        this.input.setAttribute("type", "date");
        if (this.input.type !== "date") {
            answerNode.innerHTML = "The HTML5 date feature not available in this browser.";
            TheFragebogen.logger.error(this.constructor.name + "._createAnswerNode()", "The HTML5 date feature not available in this browser.");
            return node;
        }
        this.input.min = this.min;
        this.input.max = this.max;
        this.input.pattern = this.pattern;
        this.input.addEventListener("change", () => this.setAnswer(this.input.value === "" ? null : this.input.value));

        answerNode.appendChild(this.input);

        return answerNode;
    }

    applyAnswerToUI() {
        if (!this.isUIcreated()) {
            return;
        }

        if (this.isAnswered()) {
            this.input.value = this.getAnswer();
        }
    }

    releaseUI() {
        super.releaseUI();

        this.input = null;
    }
}

/**
QuestionnaireItems that have a predefined set of potential answers.

@abstract
@class QuestionnaireItemDefined
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
*/
class QuestionnaireItemDefined extends QuestionnaireItem {

    /**
    @param {string} [className] CSS class
    @param {string} question
    @param {boolean} [required=false]
    @param {array} optionList Possible options.
    */
    constructor(className, question, required, optionList) {
        super(className, question, required);

        if (!(optionList instanceof Array)) {
            TheFragebogen.logger.error(this.constructor.name + "()", "optionList needs to be an Array.");
        }
        this.optionList = optionList;
        this.input = [];

        TheFragebogen.logger.debug(this.constructor.name + "()", "Set: optionList as " + this.optionList);
    }

    getAnswerOptions() {
        return this.optionList;
    }

    releaseUI() {
        super.releaseUI();

        this.input = [];
    }
}

/**
A QuestionnaireItemMedia is the base class for QuestionnaireItems that present media, e.g., image, audio, or video.

Playable media start playing automatically if loaded (canplaythrough=true) and `setEnabled(true)`.

ATTENTION: answer is stored on calling releaseUI() and (if UI is created) getAnswer() only.

@abstract
@class QuestionnaireItemMedia
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
*/
class QuestionnaireItemMedia extends QuestionnaireItem {

    /**
    @param {string} [className] CSS class
    @param {string} [question]
    @param {boolean} [required=false]
    @param {string|array} url The URL of the media element to be loaded; if supported by the browser also data URI. A single resource can be provided as string or multiple resources of different formats as an array.
    @param {boolean} required Element must report ready before continue.
    @param {boolean} [readyOnError] Set `ready=true` if an error occures.
    */
    constructor(className, question, required, url, readyOnError) {
        super(className, question, required);

        this.url = Array.isArray(url) ? url : [url];
        this.isContentLoaded = false;
        this.stallingCount = 0;
        this.wasSuccessfullyPlayed = false;
        this.readyOnError = readyOnError;

        this.errorOccured = false;
    }

    load() {
        TheFragebogen.logger.info(this.constructor.name + ".load()", "Start loading for " + this.getURL() + ".");
    }

    isLoaded() {
        return this.isContentLoaded;
    }

    isReady() {
        if (!this.readyOnError && this.errorOccured) {
            return false;
        }

        return this.isRequired() ? this.wasSuccessfullyPlayed : true;
    }

    getURL() {
        return this.url;
    }

    setEnabled(enabled) {
        if (!this.isUIcreated()) {
            TheFragebogen.logger.warn(this.constructor.name + ".setEnabled()", "Cannot start playback on setEnabled without createUI().");
            return;
        }
        this.enabled = enabled;

        if (enabled) {
            this._play();
        } else {
            this._pause();
        }
    }

    applyAnswerToUI() {
        //NOPE
    }

    releaseUI() {
        super.releaseUI();
        this._updateAnswer();
    }

    getAnswer() {
        if (this.isUIcreated()) {
            this._updateAnswer();
        }

        return super.getAnswer();
    }

    setAnswer(answer) {
        //NOTE: Omit calling super.setAnswer() as getAnswer() also triggers setAnswer() leading to recursion.
        this.answer = answer;
    }

    preload() {
        TheFragebogen.logger.debug(this.constructor.name + ".preload()", "Start preloading.");

        this.preloaded = false;

        this._loadMedia();
    }

    _loadMedia() {
        TheFragebogen.logger.warn(this.constructor.name + "._loadMedia()", "This method must be overridden for correct preloading.");
    }

    //Media-related callbacks
    /**
    Start playback of playable media.
    */
    _play() {
        TheFragebogen.logger.debug(this.constructor.name + "._play()", "This method must be overridden if playback is desired.");
    }

    /**
    Pause playback of playable media.
    */
    _pause() {
        TheFragebogen.logger.debug(this.constructor.name + "._pause()", "This method must be overridden if playback is desired.");
    }

    _onLoading() {
        TheFragebogen.logger.info(this.constructor.name + "._onloading()", "This method might be overriden.");
    }

    _onLoaded() {
        TheFragebogen.logger.info(this.constructor.name + "._onloaded()", "Loading done for " + this.getURL() + ".");

        if (!this.isContentLoaded) {
            this.isContentLoaded = true;
            this._sendOnPreloadedCallback();
        }

        //Autostart playback?
        if (this.isUIcreated()) {
            this.setEnabled(this.enabled);
        }
    }

    _onStalled(event) {
        this.stallingCount += 1;
        this._sendOnPreloadedCallback();

        TheFragebogen.logger.warn(this.constructor.name + "._onstalled()", "Stalling occured (" + this.stallingCount + ") for " + this.getURL());
    }

    _onError(event) {
        this.stallingCount += 1;
        this._sendOnPreloadedCallback();

        TheFragebogen.logger.error(this.constructor.name + "._onerror()", "Stalling occured (" + this.stallingCount + ") for " + this.getURL());
    }

    _onProgress(event) {
        TheFragebogen.logger.debug(this.constructor.name + "._onprogress()", "This method must be overridden if progress reporting is desired.");
    }

    _onEnded() {
        TheFragebogen.logger.info(this.constructor.name + "._onended", "Playback finished.");

        this.wasSuccessfullyPlayed = true;

        this._sendReadyStateChanged();
        this.markRequired();
    }

    /**
    Overwrite this method to add additional data to be reported.
    */
    _updateAnswer() {
        this.setAnswer([this.url, this.time]);
    }
}

/**
A base class for QuestionnaireItems using a SVG as scale.

The SVG is required to have click-positions representing the potential answers (e.g., path, rect, ellipse).
Actionlistener are added to these while the id of each answer-element represents the _answer_.
In addition, the SVG must contain an element `id="cross"` that shows the current answer (if set).

DEVELOPER:
To implement a new scale:
1. Create an SVG
1.1. Add a id=cross
1.2. Add click-position with _unique_ id (Non-unique ids also work, but setAnswer() will misbehave).
2. Override _setupSVG(): Set up the SVG and viewbox.
3. Override _getAnswerElements()
4. Override getAnswerOptions

ATTENTION:
Creating the SVG is not straight forward as the cross-element is moved to an answer using transform.
We had some trouble, if each answer-element had an individual transform (e.g., matrix) instead of an absolute position.

[Inkscape](http://inkscape.org) might add those transform if copy-and-paste is used.
To remove those transforms group and ungroup all answer-elements in Inkscape.

To test your SVG, you can use the following code (open the SVG in Chrome and open developer mode).
The cross should be positioned accordingly.

<code>
const cross=document.getElementById("cross")
const answerA = document.getElementById('10'); //Change if you use different answer

cross.setAttributeNS(null, "transform", "translate(0,0)"); //Reset cross position

transform = cross.getTransformToElement(answerA)
crossBB = cross.getBBox()
answerABB = answerA.getBBox()
cross.setAttributeNS(null, "transform", "translate(" + (-transform.e + Math.abs(answerABB.x - crossBB.x) - crossBB.width/2 + answerABB.width/2) + ",0)");
</code>

@class QuestionnaireItemSVG
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
*/
class QuestionnaireItemSVG extends QuestionnaireItem {

    /**
    @param {string} [className] CSS class
    @param {string} question
    @param {boolean} [required=false]
    */
    constructor(className, question, required) {
        super(className, question, required);

        this.scaleImage = null;
        this.answerMap = {};
        this.crossImage = null;
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        this.scaleImage = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._setupSVG();

        this.crossImage = this.scaleImage.getElementById("cross");
        //Problem identified here by the tests while using Safari 7.0.6 --- this.crossImage === null
        if (this.crossImage === null) {
            answerNode.innerHTML = '"QuestionnaireItemSVG" feature not available in this browser or SVG is not compatible.';
            this.setAnswer("Browser did not support SVG.");
            return answerNode;
        }

        this.crossImage.setAttributeNS(null, "opacity", 0);

        //Attach event listener to clickable areas.
        const answerElements = this._getAnswerElements();

        for (let i = 0; i < answerElements.length; i++) {
            if (answerElements[i].id === "cross") {
                continue;
            }

            this.answerMap[answerElements[i].id] = answerElements[i];
            answerElements[i].addEventListener("click", (event) => {
                this.setAnswer(event.target.id);
                this.applyAnswerToUI();
            });
        }

        answerNode.appendChild(this.scaleImage);
        return answerNode;
    }

    /**
    Setup this.scaleImage by definining the content and the viewbox.
    1. this.scaleImage.innerHTML = "<svg...>";
    2. this.scaleImage.setAttribute("viewBox", "0 2 136.76 21.39");
    */
    _setupSVG() {
        TheFragebogen.logger.error(this.constructor.name + "._setupSVG()", "Must be overridden.");
    }

    /**
    Returns all clickable elements representing an answer.
    Every element must have a unique id, which is used as answer.
    @returns {array}
    */
    _getAnswerElements() {
        TheFragebogen.logger.error(this.constructor.name + "._answerElements()", "Must be overridden.");
        return [];
    }

    applyAnswerToUI() {
        if (!this.isUIcreated()) {
            return;
        }

        if (this.getAnswer() === null) {
            this.crossImage.setAttributeNS(null, "opacity", 0);
            return;
        }
        if (this.answerMap[this.getAnswer()] === undefined) {
            TheFragebogen.logger.error(this.constructor.name + ".applyAnswerToUI()", "Invalid answer provided: " + this.getAnswer());
            return;
        }

        //Displays cross
        this.crossImage.setAttributeNS(null, "opacity", 1);

        //Reset previous transforms.
        this.crossImage.setAttributeNS(null, "transform", "translate(0,0)");

        //Move to new position.
        const answer = this.answerMap[this.getAnswer()];
        const crossBBox = this.crossImage.getBBox();
        const answerBBox = answer.getBBox();

        const transform = answer.getScreenCTM().inverse().multiply(this.crossImage.getScreenCTM());
        const translateX = -transform.e + Math.abs(answerBBox.x - crossBBox.x) - crossBBox.width / 2 + answerBBox.width / 2;

        TheFragebogen.logger.debug(this.constructor.name + ".applyAnswerToUI()", translateX);
        this.crossImage.setAttributeNS(null, "transform", "translate(" + translateX + ",0)");
    }

    releaseUI() {
        super.releaseUI();

        this.scaleImage = null;
        this.answerMap = {};
        this.crossImage = null;
    }

    getAnswerOptions() {
        TheFragebogen.logger.warn(this.constructor.name + ".getAnswerOptions()", "Should be overriden.");
        return super.getAnswerOptions();
    }
}

/**
An abstract QuestionnaireItem for system-defined answers.
These will be answered automatically and should not provide a UI.

@abstract
@class QuestionnaireItemSystem
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
*/
class QuestionnaireItemSystem extends QuestionnaireItem {

    constructor() {
        super(...arguments);
    }

    createUI() {
        this.uiCreated = true;
    }

    setEnabled(enable) {
        super.setEnabled(enable);
        if (this.isUIcreated() && this.isEnabled()) {
            this._sendReadyStateChanged();
        }
    }

    setVisible(visible) {
        //NOPE
    }

    isVisible() {
        return false;
    }
}

/**
A QuestionnaireItem for text input.
This item uses a HTML textarea.

@class QuestionnaireItemTextArea
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
*/
class QuestionnaireItemTextArea extends QuestionnaireItem {

    /**
    @param {string} [className] CSS class
    @param {string} question
    @param {boolean} [required=false]

    @param {number} [rows=2] The number of rows.
    @param {number} [cols=19] The number of colums.
    @param {string} [placeholder=""] The placeholder text to show.
    */
    constructor(className, question, required, rows, cols, placeholder) {
        super(className, question, required);

        this.rows = !isNaN(rows) && rows > 0 ? rows : 2;
        this.cols = !isNaN(cols) && cols > 0 ? cols : 19;
        this.placeholder = typeof(placeholder) === "string" ? placeholder : "";

        this.textarea = null;
        TheFragebogen.logger.debug(this.constructor.name + "()", "Set: rows as " + this.rows + ", cols as " + this.cols + " and placeholder as " + this.placeholder);
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        this.textarea = document.createElement("textarea");
        this.textarea.rows = this.rows;
        this.textarea.cols = this.cols;
        this.textarea.placeholder = this.placeholder;
        this.textarea.addEventListener("change", () => this.setAnswer(this.textarea.value === "" ? null : this.textarea.value));

        answerNode.appendChild(this.textarea);

        return answerNode;
    }

    applyAnswerToUI() {
        if (!this.isUIcreated()) {
            return;
        }

        if (this.isAnswered()) {
            this.textarea.value = this.getAnswer();
        }
    }

    releaseUI() {
        super.releaseUI();

        this.textarea = null;
    }
}

/**
A QuestionnaireItem for one line text input.
This item uses a HTML input field.

@class QuestionnaireItemText
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
*/
class QuestionnaireItemText extends QuestionnaireItem {

    /**
    @param {string} [className] CSS class
    @param {string} question
    @param {boolean} [required=false]
    */
    constructor(className, question, required) {
        super(className, question, required);

        this.input = null;
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        this.input = document.createElement("input");
        this.input.addEventListener("change", (event) => this.setAnswer(this.input.value === "" ? null : this.input.value));

        answerNode.appendChild(this.input);

        return answerNode;
    }

    applyAnswerToUI() {
        if (!this.isUIcreated()) {
            return;
        }

        if (this.isAnswered()) {
            this.input.value = this.getAnswer();
        }
    }

    releaseUI() {
        super.releaseUI();

        this.input = null;
    }
}

/**
This QuestionnaireItem connects to a Websocket server and may
a) send a message (ignore incoming messages),
b) wait until a certain message is received, or
c) a) and b).

Notes:
* This QuestionnaireItem is _always_ required.
* Starts connecting on setting `QuestionnaireItemWaitWebsocket.setEnabled(true)`.
* Automatically tries to reconnect on connection failure: message resend on every reconnect.
  IMPORTANT: Please note that this approach is brute force and at the moment ignores _permanent failures_ (HTTP: 404) are not handled.
* After reaching timeout, this element sets itself to ready=true.


Uses CSS classes:
* this.className (Initial before enabling)
* this.className + "Connecting"
* this.className + "Connected"
* this.className + "Reconnecting"
* this.className + "Ready" (required message received)
* NOT this.className + "Required" via `Questionnaire.markRequired()`

@class QuestionnaireItemWaitWebsocket
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
*/
class QuestionnaireItemWaitWebsocket extends QuestionnaireItem {

    /**
    @param {string} [className] CSS class

    @param {string} url The websocket URL, eg., ws://localhost:8080/someLocation.
    @param {string} [messageReceive=undefined] The message to be waiting for. `undefined`: don't wait.
    @param {string} [messageSend=undefined] The message to be sent. `undefined`: don't send anything.
    @param {number} [reconnectAttempts=-1] Number of attempts to reconnect; negative number: forever.
    @param {number} [timeout=0] Timeout in seconds.
    */
    constructor(className, url, messageSend, messageReceive, reconnectAttempts, timeout) {
        super(className, "", true);

        this.url = url;
        this.messageSend = messageSend;
        this.messageReceive = messageReceive;

        if (this.messageSend === undefined && this.messageReceive === undefined) {
            TheFragebogen.logger.error("QuestionnaireItemWaitWebsocket()", "messageSend and messageReceive are undefined; this component will not do anything.");
        }

        this.reconnectAttempts = !isNaN(reconnectAttempts) ? reconnectAttempts : -1;
        this.timeout = !isNaN(timeout) ? Math.abs(timeout) * 1000 : 0;

        this.websocketConnection = null;
        this.connectionFailures = 0;

        TheFragebogen.logger.warn("QuestionnaireItemWaitWebsocket()", "Set: url as " + this.url + ", messageSend as" + this.messageSend + ", messageReceive as " + this.messageReceive + "and timeout as " + this.timeout);
    }

    createUI() {
        this.node = document.createElement("div");
        this.uiCreated = true;

        this.applyCSS();
        return this.node;
    }

    setEnabled(enabled) {
        super.setEnabled(enabled);

        if (this.isEnabled()) { //Let's connect (and start timer)!
            this._handleConnect();

            if (this.timeout !== 0) {
                this.timeoutHandle = setTimeout(() => this._onTimeout(), this.timeout);
            }
        }
    }

    _handleConnect() {
        if (this.websocketConnection === null) {
            this.websocketConnection = new WebSocket(this.url);

            this.applyCSS("Connecting");

            this.websocketConnection.addEventListener("open", () => this._onConnected());
            this.websocketConnection.addEventListener("message", (event) => this._onMessage(event));
            this.websocketConnection.addEventListener("error", (event) => this._onWebsocketError(event));
            this.websocketConnection.addEventListener("close", (event) => this._onWebsocketClose(event));
        }
    }

    _onConnected() {
        this.applyCSS("Connected");

        if (this.messageSend === undefined) {
            TheFragebogen.logger.info(this.constructor.name + ".connection._onConnected()", "Connection opened.");
        } else {
            this.websocketConnection.send(this.messageSend);
            TheFragebogen.logger.info(this.constructor.name + ".connection._onConnected()", "Connection opened and message <<" + this.messageSend + ">> delivered.");
        }

        if (this.messageReceive === undefined) {
            TheFragebogen.logger.info(this.constructor.name + ".connection._onConnected()", "Connection opened.");
            this.setAnswer(new Date().toString());
            this.applyCSS("Ready");

            this._sendReadyStateChanged();
        }
    }

    _onMessage(event) {
        if (event.data && event.data !== this.messageReceive) {
            TheFragebogen.logger.warn(this.constructor.name + ".connection._onMessage()", "Received unknown message: <<" + event.data + ">>; waiting for <<" + this.messageReceive + ">>");
            return;
        }

        TheFragebogen.logger.info(this.constructor.name + ".connection._onMessage()", "Received correct message.");
        this.setAnswer(new Date().toString());
        this.applyCSS("Ready");

        this._sendReadyStateChanged();
    }

    _onWebsocketError(error) {
        this.applyCSS("Reconnecting");
        TheFragebogen.logger.warn(this.constructor.name + ".connection._onWebsocketError()", error);
        //Reconnect handled by onclose
    }

    _onWebsocketClose() {
        TheFragebogen.logger.warn(this.constructor.name + ".connection._onWebsocketClose()", "Connection closed.");

        if (this.isReady()) {
            return;
        }

        //Retry?
        if (this.reconnectAttempts === -1 || this.connectionFailures < this.reconnectAttempts) {
            TheFragebogen.logger.warn(this.constructor.name + ".connection._onWebsocketClose.setTimeout._anonymousFunction()", "Trying to reconnect...");

            this.websocketConnection = null;
            this._handleConnect();

            return;
        }

        //Failed permanently: That's bad...
        TheFragebogen.logger.error(this.constructor.name + ".connection._onWebsocketClose()", "Maximal number of attempts reached. QuestionnaireItemWaitWebsocket will not try to reconnect again!");
        this.ready = true;
        this._sendReadyStateChanged();
    }

    _onTimeout() {
        this._sendReadyStateChanged();

        TheFragebogen.logger.warn(this.constructor.name + "._onTimeout()", "Waiting got timeout after " + (!this.connectionFailures ? (this.timeout + "ms.") : (this.connectionFailures + " attempt(s).")));
    }

    markRequired() {
        //This elements shows its status and is always required.
    }

    releaseUI() {
        super.releaseUI();

        clearTimeout(this.timeoutHandle);
        this.timeoutHandle = null;

        if (this.websocketConnection !== null && (this.websocketConnection.readyState == WebSocket.CONNECTING || this.websocketConnection.readyState == WebSocket.OPEN)) {
            this.websocketConnection.onclose = () => TheFragebogen.logger.info(this.constructor.name + ".connection._releaseUI()", "Connection closed.");
            this.websocketConnection.close();
        }
        this.websocketConnection = null;
    }
}

/**
A QuestionnaireItem for free-hand input (drawing or writing).
Uses mouse simulation to draw a canvas.

Reports answer as base64-coded PNG image.
ATTENTION: answer is stored on calling releaseUI() and (if UI is created) getAnswer() only.
ATTENTION: disables context menu (i.e., right click menu).

Supports HDPI.

Apply "cursor: none;" if stylus input is used.

@class QuestionnaireItemWrite
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
*/
class QuestionnaireItemWrite extends QuestionnaireItem {

    /**
    @param {string} [className] CSS class
    @param {string} [question] The question
    @param {boolean} [required=false] Is this QuestionnaireItem required to be answered?
    @param {string} [backgroundImg] URL of the background image
    @param {number} [height=240]
    @param {number} [width=320]
    @param {number} [drawSize=1] The radius of the pen in px.
    @param {number} [eraserSize=10] The radius of the eraser in px.
    */
    constructor(className, question, required, backgroundImg, width, height, drawColor, drawSize, eraserSize) {
        super(className, question, required);

        this.backgroundImg = backgroundImg !== undefined ? backgroundImg : "";
        this.height = !isNaN(height) && height > 0 ? height : 240;
        this.width = !isNaN(width) && width > 0 ? width : 320;

        this.pixelRatio = 1; //HDPI support.
        this.drawColor = (typeof(drawColor) === "string" ? drawColor : "black");
        this.drawSize = !isNaN(drawSize) && drawSize > 0 ? drawSize : 1;
        this.eraserSize = !isNaN(eraserSize) && eraserSize > 0 ? eraserSize : 10;

        TheFragebogen.logger.debug(this.constructor.name + "()", "Set: backgroundImg as " + this.backgroundImg + ", height as " + this.height + ", width as " + this.width + ", drawColor as " + this.drawColor + ", drawSize as " + this.drawSize + " and eraserSize as " + this.eraserSize);

        this.painting = false;
        this.penWasDown = false;
        this.eraserMode = false; //True: eraser, False: draw
        this.lastDrawX = null;
        this.lastDrawY = null;

        this.context = null;
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");
        const canvas = document.createElement("canvas");
        if (this.width !== null) {
            canvas.width = this.width;
        }
        if (this.height !== null) {
            canvas.height = this.height;
        }
        answerNode.appendChild(canvas);

        this.context = canvas.getContext("2d");
        this.context.lineJoin = "round";

        //Center background image
        if (this.backgroundImg !== null) {
            canvas.style.background = "url('" + this.backgroundImg + "') 50% 50% / contain no-repeat";
        }

        canvas.addEventListener("mousedown", (event) => this.onWritingStart(event));
        canvas.addEventListener("mousemove", (event) => this.onWriting(event));
        canvas.addEventListener("mouseup", () => this.onWritingStop());
        canvas.addEventListener("mouseout", () => this.onWritingStop());

        //Disable contextmenu, so right click can be
        canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        }, true);

        //BEGIN: EXPERIMENTAL
        //This uses allows us to be HDPI conform!
        //Only works in Chrome so far! And it is a hack! See: http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        this.pixelRatio = window.devicePixelRatio || 1 / this.context.webkitBackingStorePixelRatio || 1;

        canvas.style.width = canvas.width;
        canvas.style.height = canvas.height;

        canvas.width = canvas.width * this.pixelRatio;
        canvas.height = canvas.height * this.pixelRatio;

        this.context.scale(this.pixelRatio, this.pixelRatio);
        //END: EXPERIMENTAL
        return answerNode;
    }

    applyAnswerToUI() {
        if (this.isAnswered()) {
            TheFragebogen.logger.debug(this.constructor.name + "_createAnswerNode()", "Already answered; restoring image.");

            this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
            const img = new Image();
            img.addEventListener("load", () => {
                const ratio_w = img.width / parseInt(this.context.canvas.style.width);
                const ratio_h = img.height / parseInt(this.context.canvas.style.height);
                this.context.scale(1 / ratio_w, 1 / ratio_h);
                this.context.drawImage(img, 0, 0);
                this.context.scale(ratio_w, ratio_h);
            });
            img.addEventListener("error", () => TheFragebogen.logger.error("Could not restore image from answer."));
            img.src = this.getAnswer();
        }
    }

    /**
    Pen is down on the paper.
    */
    onWritingStart(event) {
        if (!this.isEnabled()) {
            return;
        }

        this.painting = true;
        this.eraserMode = event.button !== 0; //The not-left mouse button is the eraser
        this.penWasDown = false;

        this.onWriting(event);
    }

    /**
    Pen is moving on the paper.
    */
    onWriting(event) {
        if (!this.isEnabled() || !this.painting) {
            return;
        }

        const x = event.pageX - event.target.offsetLeft;
        const y = event.pageY - event.target.offsetTop;

        this.context.beginPath();

        if (this.eraserMode) {
            this.context.globalCompositeOperation = "destination-out";
            this.context.arc(x, y, this.eraserSize, 0, Math.PI * 2, false);
            this.context.fill();
        } else {
            this.context.globalCompositeOperation = "source-over";
            if (this.penWasDown) {
                this.context.moveTo(this.lastDrawX, this.lastDrawY);
            } else {
                this.context.moveTo(x - 1, y);
            }

            this.context.lineTo(x, y);
            this.context.strokeStyle = this.drawColor;
            this.context.lineWidth = this.drawSize;
            this.context.stroke();
        }

        //The following lines cannot be put above, because it must be done after the draw.
        this.penWasDown = true;
        this.lastDrawX = x;
        this.lastDrawY = y;
    }

    /**
    Pen left paper, so save the answer.
    */
    onWritingStop() {
        this.painting = false;

        if (this.isAnswered()) {
            this.markRequired();
        }
        this._sendReadyStateChanged();
    }

    getAnswer() {
        if (this.isUIcreated() && this.isAnswered()) {
            this.setAnswer(this.context.canvas.toDataURL("image/png"));
        }

        return super.getAnswer();
    }

    releaseUI() {
        //Store answer from UI component
        this.getAnswer();

        super.releaseUI();

        this.context = null;
        this.pixelRatio = 1;
        this.lastDrawX = null;
        this.lastDrawY = null;
        this.penWasDown = false;
        this.painting = false;
        this.eraserMode = false;
    }
}

/**
A screen that downloads the currently stored data of the questionnaire in CSV format as a file.
A message is presented while uploading.
Default timeout: 300s; should not be relevant.

@class ScreenWaitDataDownload
@augments Screen
@augments ScreenWait
@augments ScreenWaitData
*/
class ScreenWaitDataDownload extends ScreenWaitData {

    /**
    @param {string} [className] CSS class
    @param {string} [message="Downloading data"] Message to be displayed.
    @param {string} [filename="TheFragebogen.csv"] Name of the file to be downloaded
    @param {boolean} [includeAnswerChangelog=false] Should the the changelog of the answer be reported?
    */
    constructor(className, message, filename, includeAnswerChangelog) {
        super(className, 300, typeof(message) === "string" ? message : "Downloading data", includeAnswerChangelog);

        this.filename = (typeof(filename) === "string" ? filename : "TheFragebogen.csv");

        TheFragebogen.logger.debug(this.constructor.name + "()", "Set: filename as " + this.filename);
    }

    createUI() {
        this.node = document.createElement("div");
        this.applyCSS();

        const span = document.createElement("span");
        span.innerHTML = this.html;
        this.node.appendChild(span);

        return this.node;
    }

    /**
    On start(), the screenController.requestDataCSV() is called with this.callbackDownload() as callback.
    ScreenController needs to set the callback accordingly.
    */
    start() {
        this._sendGetDataCallback();
        this.callbackDownload(this.data);
    }

    /**
    Callback to download data.
    @param {string} data
    */
    callbackDownload(data) {
        TheFragebogen.logger.info(this.constructor.name + ".callbackDownload()", data);
        downloadData(this.filename, data);
        this._sendPaginateCallback();
    }
}

/**
A screen that uploads the currently stored data of the questionnaire in CSV format to a webserver via AJAX (HTTP POST).
A message is presented while uploading.
Default timeout: 4s.

USER: Be aware of Cross-site origin policy: http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
The web server must be configured accordingly if upload URL is different than the URL the questionnaire was loaded from.

@class ScreenWaitDataUpload
@augments Screen
@augments ScreenWait
@augments ScreenWaitData
*/
class ScreenWaitDataUpload extends ScreenWaitData {

    /**
    @param {string} [className] CSS class
    @param {string} [url]
    @param {number} [timeout=4] timeout in seconds
    @param {string} [message="Here you can get to the map:<br><a href='http://127.0.0.1:5000/map/'>-->"]
    @param {string} [httpParamaterName="data"]
    @param {string} [failMessage="Upload failed. Data will be downloaded to local computer now."]
    @param {boolean} [nextScreenOnFail=true] Continue to next screen if upload failed.
    @param {boolean} [includeAnswerChangelog=false] Should the the changelog of the answer be reported?
    */
    constructor(className, url, timeout, message, httpParameterName, failMessage, nextScreenOnFail, includeAnswerChangelog) {
        super(className, !isNaN(timeout) ? Math.abs(timeout) : 4, typeof(message) === "string" ? message : "Uploading data. Please wait...", includeAnswerChangelog);

        this.failMessage = (typeof(failMessage) === "string" ? failMessage : "Upload failed. Data will be downloaded to local computer now.");
        this.httpParameterName = (typeof(httpParameterName) === "string" ? httpParameterName : "data");
        this.nextScreenOnFail = (typeof(nextScreenOnFail) === "boolean") ? nextScreenOnFail : true;

        this.url = url;
        this.request = null;
        this.retryCount = 0;
        this.data = null;
        this.retry = 0;

        TheFragebogen.logger.debug(this.constructor.name + "()", "Set: httpParameterName as " + this.httpParameterName);
    }

    createUI() {
        this.node = document.createElement("div");
        this.applyCSS();

        const span = document.createElement("span");
        span.innerHTML = this.html;
        this.node.appendChild(span);

        if (this.paginateUI != null) {
            this.paginateUI.setPaginateCallback(() => this._sendPaginateCallback());
            this.node.appendChild(this.paginateUI.createUI());
        }

        return this.node;
    }

    /**
    On start(), the screenController.requestDataCSV() is called with this.callbackUpload() as callback.
    */
    start() {
        this.retryCount = 0;

        this._sendGetDataCallback();
        this.callbackUpload(this.data);
    }

    /**
    Callback to upload data.
    @param {string} data
    */
    callbackUpload(data) {
        TheFragebogen.logger.info(this.constructor.name + ".callbackUpload()", "Starting upload to " + this.url);

        this.retry = null;
        this.retryCount++;
        this.data = data;

        this.request = new XMLHttpRequest();
        this.request.open("POST", this.url, true);
        this.request.timeout = this.time;

        this.request.addEventListener("timeout", () => this._onTimeout());
        this.request.addEventListener("load", () => this._onLoad());
        this.request.addEventListener("error", (event) => this._onError(event));

        this.request.send(this.httpParameterName + "=" + data);
    }

    /**
    Callback if upload was successful; screen is then ready to continue.
    */
    _onLoad() {
        if (this.request.readyState === 4 && this.request.status === 200) {
            TheFragebogen.logger.info(this.constructor.name + ".callbackUpload()", "Successful.");
            if (this.request.responseText !== "") {
                TheFragebogen.logger.info(this.constructor.name + "._onLoad()", this.request.responseText);
            }

            this._sendPaginateCallback();
        } else {
            TheFragebogen.logger.error(this.constructor.name + "._onLoad()", "Request to " + this.url + " failed with status code " + this.request.status);
            this.retryCount = 4;
            this._onError();
        }

        this.request = null;
    }

    /**
    Callback if upload failed and schedules a retry.
    */
    _onError(event) {
        const span = document.createElement("span");
        span.innerHTML = "" + "Upload failed. With request status " + this.request.status + " Retrying in 5 seconds.";
        this.node.appendChild(span);
        this.retry = setTimeout(() => this.callbackUpload(), 5000, this.data);

        TheFragebogen.logger.error(this.constructor.name + ".callbackUpload()", "Upload failed with HTTP code: " + this.request.status + ". Retrying in 5 seconds.");
    }

    /**
    Callback if timeout.
    */
    _onTimeout() {
        TheFragebogen.logger.error(this.constructor.name + ".callbackUpload()", "Upload got timeout after " + this.time + "ms.");
        this._onError();
    }

    releaseUI() {
        super.releaseUI();

        if (this.retry !== null) {
            clearTimeout(this.retry);
        }

        if (this.request instanceof XMLHttpRequest) {
            this.request.abort();
        }
        this.request = null;
    }
}

/**
A QuestionnaireItem that has a predefined set of answer and multiple of these can be selected.
A group of checkboxes is used.

@class QuestionnaireItemDefinedMulti
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemDefined
*/
class QuestionnaireItemDefinedMulti extends QuestionnaireItemDefined {

    /**
    @param {string} [className] CSS class
    @param {string} question
    @param {boolean} [required=false]
    @param {array} optionList
    */
    constructor(className, question, required, optionList) {
        super(className, question, required, optionList);

        this.identifier = Math.random(); //Part of the identifier for the label + checkbox relation.
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        for (let i = 0; i < this.optionList.length; i++) {
            this.input[i] = document.createElement("input");
            this.input[i].type = "checkbox";
            this.input[i].id = this.identifier + i;
            this.input[i].name = this.identifier;
            this.input[i].value = this.optionList[i];

            this.input[i].addEventListener("change", (event) => this._handleChange(event));

            const label = document.createElement("label");
            label.setAttribute("for", this.identifier + i);
            label.innerHTML = this.optionList[i];

            answerNode.appendChild(this.input[i]);
            answerNode.appendChild(label);
        }

        return answerNode;
    }

    _handleChange(event) {
        let selectedOptions = this._getAnswer();
        const currentIndex = selectedOptions.indexOf(event.target.value);

        if (event.target.checked && currentIndex === -1) {
            selectedOptions.push(event.target.value);
        }
        if (!event.target.checked) {
            selectedOptions.splice(currentIndex, 1);
        }

        this.setAnswer(selectedOptions.sort());
    }

    applyAnswerToUI() {
        if (!this.isUIcreated()) {
            return;
        }

        const selectedOptionList = this._getAnswer();
        for (let i = 0; i < this.input.length; i++) {
            this.input[i].checked = selectedOptionList.indexOf(this.optionList[i]) !== -1;
        }
    }

    getAnswer() {
        return super.getAnswer();
    }

    _getAnswer() {
        return this.getAnswer() || [];
    }

    isAnswered() {
        return this._getAnswer().length > 0;
    }

    releaseUI() {
        super.releaseUI();

        this.identifier = null;
    }
}

/**
QuestionnaireItems that have a predefined set of answer and one of these can be selected.
A group of radiobuttons is used.

@class QuestionnaireItemDefinedOne
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemDefined
*/
class QuestionnaireItemDefinedOne extends QuestionnaireItemDefined {

    /**
    @param {string} [className] CSS class
    @param {string} questions
    @param {boolean} [required=false]
    @param {array} optionList
    */
    constructor(className, question, required, optionList) {
        super(className, question, required, optionList);

        this.identifier = Math.random(); //Part of the identifier for the label + radiobutton relation.
    }

    _createAnswerNode() {
        const tableRowLabel = document.createElement('tr');
        const tableRowRadio = document.createElement('tr');

        for (let i = 0; i < this.optionList.length; i++) {
            this.input[i] = document.createElement("input");
            this.input[i].value = i;
            this.input[i].id = this.identifier + i;
            this.input[i].name = this.identifier;
            this.input[i].type = "radio";

            if (this.getAnswer() === this.optionList[i]) {
                this.input[i].checked = true;
            }

            this.input[i].addEventListener("change", (event) => this.setAnswer(this.optionList[event.target.value]));

            const label = document.createElement("label");
            label.setAttribute("for", this.identifier + i);
            label.innerHTML = this.optionList[i];

            const tdLabel = document.createElement('td');
            tdLabel.appendChild(label);
            tableRowLabel.appendChild(tdLabel);

            const tdRadio = document.createElement('td');
            tdRadio.appendChild(this.input[i]);
            tableRowRadio.appendChild(tdRadio);
        }

        const tableBody = document.createElement('tbody');
        tableBody.appendChild(tableRowLabel);
        tableBody.appendChild(tableRowRadio);

        const table = document.createElement('table');
        table.style.display = "inline"; //CSS
        table.appendChild(tableBody);

        return table;
    }

    applyAnswerToUI() {
        if (!this.isUIcreated()) {
            return;
        }

        if (this.getAnswer() === null) {
            this.input.map((input) => input.checked = false);
            return;
        }

        const selectedOption = this.optionList.indexOf(this.getAnswer());
        if (selectedOption === -1) {
            TheFragebogen.logger.warn(this.constructor.name, "applyAnswerToUI(): option unknown; cannot restore to UI. " + this.getAnswer());
            return;
        }

        this.input[optionList].checked = true;
    }

    releaseUI() {
        super.releaseUI();

        this.identifier = null;
    }
}

/**
A QuestionnaireItem that can be used to input number ranges.
Uses the HTML input type="range".

@class QuestionnaireItemDefinedRange
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemDefined
*/
class QuestionnaireItemDefinedRange extends QuestionnaireItemDefined {

    /**
    @param {string} [className] CSS class
    @param {string} question
    @param {boolean} [required=false]
    @param {int} [min] Minimal acceptable answer.
    @param {int} [max] Maximal acceptable answer.
    */
    constructor(className, question, required, min, max) {
        super(className, question, required, [min, max]);

        this.min = min;
        this.max = max;

        this.input = null;
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        this.input = document.createElement("input");
        this.input.type = "range";
        this.input.min = this.min;
        this.input.max = this.max;
        this.input.addEventListener("change", () => this.setAnswer(this.input.value));

        answerNode.appendChild(this.input);

        return answerNode;
    }

    applyAnswerToUI() {
        if (!this.isUIcreated()) {
            return;
        }

        if (this.isAnswered()) {
            this.input.value = this.getAnswer();
        }
    }

    releaseUI() {
        super.releaseUI();

        this.input = null;
    }
}

/**
A QuestionnaireItem that has a predefined set of answer and one of these can be selected.
A HTML select-element is used.

@class QuestionnaireItemDefinedSelector
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemDefined
*/
class QuestionnaireItemDefinedSelector extends QuestionnaireItemDefined {

    /**
    @param {string} [className] CSS class
    @param {string} question question
    @param {boolean} [required=false]
    @param {array} optionList
    */
    constructor(className, question, required, optionList) {
        super(className, question, required, optionList);
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        this.select = document.createElement("select");
        this.select.addEventListener("change", () => this.setAnswer(this.select.value === "" ? null : this.select.value));

        const optionNull = document.createElement("option");
        optionNull.value = "";
        optionNull.disabled = true;
        optionNull.selected = true;
        optionNull.innerHTML = "";
        this.select.appendChild(optionNull);

        for (let i = 0; i < this.optionList.length; i++) {
            const option = document.createElement("option");
            option.value = this.optionList[i];
            option.innerHTML = this.optionList[i];
            this.select.appendChild(option);
        }

        answerNode.appendChild(this.select);

        return answerNode;
    }

    applyAnswerToUI() {
        if (!this.isUIcreated()) {
            return;
        }

        if (this.isAnswered()) {
            this.select.value = this.getAnswer();
        }
    }

    releaseUI() {
        super.releaseUI();

        this.input = [];
        this.select = null;
    }
}

/**
A QuestionnaireItemMedia that plays an audio file.
NOTE: Useful to capture failure to loads.
This item reports as an array audio playback statistics [url, duration, stallingCount, replayCount, audioStartTimes, audioPlayDurations].
url corresponds to the array of all sources for this element.
The duration is the total audio length in seconds.
stallingCount counts how often a stalling event occured.
replayCount counts how often the audio got replayed explicitly by the user.
audioStartTimes are the points in time, relative to creation of the audio, when the audio started playing.
audioPlayDurations are the times in seconds how long the audio played each time.

@class QuestionnaireItemMediaAudio
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemMedia
*/
class QuestionnaireItemMediaAudio extends QuestionnaireItemMedia {

    /**
    @param {string} [className] CSS class
    @param {string} [question]
    @param {boolean} [required=false]
    @param {string|array<string>} url The URL of the media element to be loaded; if supported by the browser also data URI.
    @param {boolean} required Element must report ready before continue.
    @param {boolean} [readyOnError=true] Sets ready=true if an error occures.
    */
    constructor(className, question, required, url, readyOnError) {
        super(className, question, required, url, readyOnError);

        this.audioNode = null;
        this.progressbar = null;

        this.audioPlayDurations = []; // Stores how long the audio got listend to each time
        this.audioCreationTime = null; // Point in time when the audio gets created
        this.audioStartTimes = []; // Stores when the audio started relative to audioCreationTime
        this.replayCount = 0; // Counts how often the audio got replayed explicitly with replay()
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        this._createMediaNode();
        this.audioCreationTime = new Date().getTime(); // Before play event listener gets set

        this.progressbar = document.createElement("progress");
        answerNode.appendChild(this.progressbar);

        answerNode.appendChild(this.audioNode);

        this.audioNode.addEventListener("timeupdate", (event) => this._onProgress(event));
        this.audioNode.addEventListener("error", (event) => this._onError(event));
        this.audioNode.addEventListener("ended", () => this._onEnded());
        this.audioNode.addEventListener("stalled", () => this._onStalled());
        this.audioNode.addEventListener("play", () => this._onPlay());

        return answerNode;
    }

    releaseUI() {
        this.audioPlayDurations.push(this.audioNode.currentTime);
        super.releaseUI();

        this.audioNode = null;
        this.progressbar = null;
    }

    _loadMedia() {
        this._createMediaNode();
    }

    _createMediaNode() {
        if (this.audioNode !== null) {
            TheFragebogen.logger.debug(this.constructor.name + "()", "audioNode was already created.");
            return;
        }

        this.audioNode = new Audio();
        this.audioNode.addEventListener("canplaythrough", () => this._onLoaded());

        for (let i = 0; i < this.url.length; i++) {
            const audioSource = document.createElement("source");
            audioSource.src = this.url[i];
            this.audioNode.appendChild(audioSource);
        }

        let pTag = document.createElement("p");
        pTag.innerHTML = "This is a fallback content. Your browser does not support the provided audio formats.";
        this.audioNode.appendChild(pTag);
    }

    replay() {
        this.audioPlayDurations.push(this.audioNode.currentTime);
        this.replayCount += 1;
        this._updateAnswer();

        this.audioNode.pause();
        this.audioNode.currentTime = 0.0;
        this.audioNode.play();
    }

    _play() {
        if (this.audioNode === null) {
            TheFragebogen.logger.warn(this.constructor.name + "()", "Cannot start playback without this.audioNode.");
            return;
        }
        try {
            this.audioNode.play();
        } catch (e) {
            TheFragebogen.logger.warn(this.constructor.name + "()", "No supported format available.");
            this._onError();
        }
    }

    _pause() {
        if (this.audioNode === null) {
            TheFragebogen.logger.warn(this.constructor.name + "()", "Cannot start playback without this.audioNode.");
            return;
        }
        this.audioNode.pause();
    }

    _onProgress() {
        if (this.progressbar && !isNaN(this.audioNode.duration)) {
            this.progressbar.value = (this.audioNode.currentTime / this.audioNode.duration);
        }
    }

    _onPlay() {
        this.audioStartTimes.push((new Date().getTime() - this.audioCreationTime) / 1000);
        this._updateAnswer();
    }

    _updateAnswer() {
        this.setAnswer([this.url, this.audioNode.duration, this.stallingCount, this.replayCount, this.audioStartTimes, this.audioPlayDurations]);
    }
}

/**
A QuestionnaireItemMedia that displays an image.
NOTE: Useful to capture failure to loads.

@class QuestionnaireItemMediaImage
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemMedia
*/
class QuestionnaireItemMediaImage extends QuestionnaireItemMedia {

    /**
    @param {string} [className] CSS class
    @param {string} [question]
    @param {boolean} [required=false]
    @param {string|array<string>} url The URL of the media element to be loaded; if supported by the browser also data URI.
    @param {boolean} required Element must report ready before continue.
    @param {boolean} [readyOnError=true] Sets ready=true if an error occures.
    */
    constructor(className, question, required, url, readyOnError) {
        super(className, question, required, url, readyOnError);

        if (this.url.length != 1) {
            TheFragebogen.logger.warn("QuestionnaireItemMediaImage()", "called with multiple resources as url. Falling back to the first element in the array.");
        }

        this.imageNode = null;
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        this._createMediaNode();

        answerNode.appendChild(this.imageNode);

        return answerNode;
    }

    releaseUI() {
        super.releaseUI();

        this.imageNode = null;
    }

    _loadMedia() {
        this._createMediaNode();
    }

    _createMediaNode() {
        if (this.imageNode !== null) {
            TheFragebogen.logger.debug("QuestionnaireItemMediaImage()", "Images was already created.");
            return;
        }

        this.imageNode = new Image();
        this.imageNode.addEventListener("load", () => this._onLoaded());
        this.imageNode.src = this.url[0];
    }
}

/**
A QuestionnaireItemMedia that plays a video.
NOTE: Useful to capture failure to loads.
This item reports as an array video playback statistics [url, duration, stallingCount, replayCount, videoStartTimes, videoPlayDurations].
url corresponds to the array of all sources for this element.
The duration is the total video length in seconds.
stallingCount counts how often a stalling event occured.
replayCount counts how often the video got replayed explicitly by the user.
videoStartTimes are the points in time, relative to creation of the video, when the video started playing.
videoPlayDurations are the times in seconds how long the video played each time.

@class QuestionnaireItemMediaVideo
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemMedia
*/
class QuestionnaireItemMediaVideo extends QuestionnaireItemMedia {

    /**
    @param {string} [className] CSS class
    @param {string} [question]
    @param {boolean} [required=false]
    @param {string|array<string>} url The URL of the media element to be loaded; if supported by the browser also data URI.
    @param {boolean} required Element must report ready before continue.
    @param {boolean} [readyOnError=true] Sets ready=true if an error occures.
    @param {boolean} [videoPlaysInline=false] Play video within parent element.
    */
    constructor(className, question, required, url, readyOnError, videoPlaysInline) {
        super(className, question, required, url, readyOnError);

        this.videoNode = null;

        this.videoPlayDurations = []; // Stores how long the video got watched each time
        this.videoCreationTime = null; // Point in time when the video gets created
        this.videoStartTimes = []; // Stores when the video started relative to videoCreationTime
        this.replayCount = 0; // Counts how often the video got replayed explicitly with replay()
        this.videoPlaysInline = videoPlaysInline;
    }

    _createAnswerNode() {
        const answerNode = document.createElement("div");

        this._createMediaNode();
        this.videoCreationTime = new Date().getTime(); // Before play event listener gets set

        answerNode.appendChild(this.videoNode);

        this.videoNode.addEventListener("timeupdate", (event) => this._onProgress(event));
        this.videoNode.addEventListener("error", (event) => this._onError(event));
        this.videoNode.addEventListener("ended", () => this._onEnded());
        this.videoNode.addEventListener("stalled", () => this._onStalled());
        this.videoNode.addEventListener("play", this._onPlay());

        return answerNode;
    }

    releaseUI() {
        this.videoPlayDurations.push(this.videoNode.currentTime);
        super.releaseUI();

        this.videoNode = null;
    }

    _loadMedia() {
        this._createMediaNode();
    }

    _createMediaNode() {
        if (this.videoNode !== null) {
            TheFragebogen.logger.debug(this.constructor.name + "()", "videoNode was already created.");
            return;
        }

        this.videoNode = document.createElement('video');
        if (this.videoPlaysInline) {
            // Play video within parent element
            this.videoNode.setAttribute("playsinline", "");
        }
        this.videoNode.addEventListener("canplaythrough", () => this._onLoaded());

        for (let i = 0; i < this.url.length; i++) {
            const videoSource = document.createElement("source");
            videoSource.src = this.url[i];
            this.videoNode.appendChild(videoSource);
        }

        let pTag = document.createElement("p");
        pTag.innerHTML = "This is a fallback content. Your browser does not support the provided video formats.";
        this.videoNode.appendChild(pTag);
    }

    replay() {
        this.videoPlayDurations.push(this.videoNode.currentTime);
        this.replayCount += 1;

        this.videoNode.pause();
        this.videoNode.currentTime = 0.0;
        this.videoStartTimes.push((new Date().getTime() - this.videoCreationTime) / 1000);
        this.videoNode.play();

        this._updateAnswer();
    }

    _play() {
        if (this.videoNode === null) {
            TheFragebogen.logger.warn(this.constructor.name + "()", "Cannot start playback without this.videoNode.");
            return;
        }

        try {
            this.videoNode.play();
        } catch (e) {
            TheFragebogen.logger.warn(this.constructor.name + "()", "No supported format availble.");
            this._onError();
        }
    }

    _pause() {
        if (this.videoNode === null) {
            TheFragebogen.logger.warn(this.constructor.name + "()", "Cannot start playback without this.videoNode.");
            return;
        }
        this.videoNode.pause();
    }

    _onProgress() {
        //Nope
    }

    _onPlay() {
        this.videoStartTimes.push((new Date().getTime() - this.videoCreationTime) / 1000);
    }

    _updateAnswer() {
        this.setAnswer([this.url, this.videoNode.duration, this.stallingCount, this.replayCount, this.videoStartTimes, this.videoPlayDurations]);
    }
}

/**
A QuestionnaireItem presenting the NASA Task Load Index, cf. http://humansystems.arc.nasa.gov/groups/tlx/downloads/TLXScale.pdf
See also the manual at http://humansystems.arc.nasa.gov/groups/tlx/downloads/TLX_pappen_manual.pdf

@class QuestionnaireItemSVGNASATLX
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSVG
*/
class QuestionnaireItemSVGNASATLX extends QuestionnaireItemSVG {

    /**
    @param {string} [className] CSS class
    @param {string} question
    @param {boolean} [required=false]
    @param {string} [captionRight] The caption of the left label.
    @param {string} [captionLeft] The caption of the right label.
    */
    constructor(className, question, required, captionLeft, captionRight) {
        super(className, question, required);

        this.captionLeft = captionLeft;
        this.captionRight = captionRight;
    }

    _setupSVG() {
        this.scaleImage.setAttribute("viewBox", "0 5 115 20");
        this.scaleImage.innerHTML = '<?xml version="1.0" encoding="utf-8" standalone="no"?><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="115" height="22.750004" id="svg5198" version="1.1"><defs id="defs5200" /><metadata id="metadata5203"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /><dc:title /></cc:Work></rdf:RDF></metadata><g style="display:inline" transform="translate(-14.754855,-1027.4342)" id="layer1"><rect y="1041.2622" x="133.00023" height="2.0999999" width="1.000026" id="rect5765-9-9-0-0-8-0" style="opacity:0;fill:#000000;fill-opacity:1" /><rect y="1041.2622" x="136.99986" height="2.0999999" width="1" id="rect5765-9-4-2-3-5-0-5" style="opacity:0;fill:#000000;fill-opacity:1" /><text transform="translate(12.104855,1032.0442)" id="text4739" y="18.240952" x="6.717514" style="font-style:normal;font-weight:normal;font-size:40px;line-height:125%;font-family:Sans;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan y="18.240952" x="6.717514" id="tspan4741" /></text><text id="labelLeft" y="1045.1559" x="30" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:3px;line-height:100%;font-family:Sans;-inkscape-font-specification:Sans;text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:middle;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan style="text-align:start;text-anchor:start" id="tspan3853" y="1045.1559" x="30">left</tspan></text><text id="labelRight" y="1044.7682" x="105" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:3px;line-height:100%;font-family:Sans;-inkscape-font-specification:Sans;text-align:start;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:start;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan style="text-align:end;text-anchor:end" id="tspan3853-3" y="1044.7682" x="105">right</tspan></text><path id="path4250" d="m 22.104855,1041.2842 99.999995,0" style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:0.30000001;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /><path id="path4252" d="m 22.204855,1041.4342 0,-5" style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:0.23783921;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /><use height="100%" width="100%" id="use5759" transform="translate(5,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5761" transform="translate(10,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5763" transform="translate(15,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5765" transform="translate(20,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5767" transform="translate(25,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5769" transform="translate(30,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5771" transform="translate(35,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5773" transform="translate(40,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5775" transform="translate(45,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5777" transform="matrix(1,0,0,1.6,50,-624.86052)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5779" transform="translate(55,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5781" transform="translate(60,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5783" transform="translate(65,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5785" transform="translate(70,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5787" transform="translate(75,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5789" transform="translate(80,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5791" transform="translate(85,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5793" transform="translate(90,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5795" transform="translate(95,0)" xlink:href="#path4252" y="0" x="0" /><use height="100%" width="100%" id="use5797" transform="translate(100,0)" xlink:href="#path4252" y="0" x="0" /></g><g id="layer2" transform="translate(5.2451471,8.9279683)" style="display:inline;opacity:1"><rect y="-2.9323058" x="-0.51732278" height="11.83144" width="4.9709902" id="0" style="opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="4.5553379" height="11.83144" width="4.9709902" id="1" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="9.615571" height="11.83144" width="4.9709902" id="2" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="14.675803" height="11.83144" width="4.9709902" id="3" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="19.758133" height="11.83144" width="4.9709902" id="4" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="24.840464" height="11.83144" width="4.9709902" id="5" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="29.768116" height="11.83144" width="4.9709902" id="6" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="34.607376" height="11.83144" width="4.9709902" id="7" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="39.512932" height="11.83144" width="4.9709902" id="8" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="44.617355" height="11.83144" width="4.9709902" id="9" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="49.677589" height="11.83144" width="4.9709902" id="10" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="54.715725" height="11.83144" width="4.9709902" id="11" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="59.731762" height="11.83144" width="4.9709902" id="12" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="64.747803" height="11.83144" width="4.9709902" id="13" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="69.76384" height="11.83144" width="4.9709902" id="14" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="74.757782" height="11.83144" width="4.9709902" id="15" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="79.751724" height="11.83144" width="4.9709902" id="16" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="84.767761" height="11.83144" width="4.9709902" id="17" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="89.720268" height="11.83144" width="4.9709902" id="18" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="94.689362" height="11.83144" width="4.9709902" id="19" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><rect y="-2.9323058" x="99.528618" height="11.83144" width="4.9709902" id="20" style="display:inline;opacity:0;stroke:#000000;stroke-width:0.11210302px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></g><g transform="translate(4.3500016,8.0625619)" style="display:inline" id="layer4"><path id="cross" d="m 1.1153525,4.3356463 c -2.9687502,2.9375 -2.9687502,2.9375 -2.9687502,2.9375 l 1.53125034,-1.46875 -1.50000034,-1.53125 2.9687502,3" style="display:inline;fill:none;stroke:#000000;stroke-width:0.60000002;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /></g></svg>';

        this.scaleImage.getElementById("labelLeft").textContent = this.captionLeft;
        this.scaleImage.getElementById("labelRight").textContent = this.captionRight;
    }

    _getAnswerElements() {
        return this.scaleImage.getElementsByTagName("rect");
    }

    getAnswerOptions(data) {
        return "0-20";
    }
}

/**
A QuestionnaireItem presenting the 7pt Quality scale as defined in ITU-T P.851 p. 19.
Labels are by default in German - the content of the labels is defined in the SVG.

@class QuestionnaireItemSVGQuality7pt
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSVG
*/
class QuestionnaireItemSVGQuality7pt extends QuestionnaireItemSVG {

    /**
    @param {string} [className] CSS class
    @param {string} question
    @param {boolean} [required=false]
    @param {string[]} [labels=["NOTE: Default labels are defined in the SVG."]] The labels (7 items; evaluated to string)
    */
    constructor(className, question, required, labels) {
        super(className, question, required);

        this.labels = labels;
    }

    _setupSVG() {
        this.scaleImage = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.scaleImage.setAttribute("viewBox", "0 2 136.76 21.39");
        this.scaleImage.innerHTML = '<?xml version="1.0" encoding="utf-8" standalone="no"?><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg5198" height="21.394005" width="136.76094"><defs id="defs5200" /><metadata id="metadata5203"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /><dc:title /></cc:Work></rdf:RDF></metadata><g style="display:inline" transform="translate(-12.104855,-1030.0402)" id="layer1"><rect y="1036.3621" x="30" height="1" width="103" id="rect5206" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="25" height="2.0999999" width="1.000026" id="rect5763" style="opacity:0;fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="29.000103" height="2.0999999" width="1.000026" id="rect5765" style="opacity:0;fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="33.000206" height="2.0999999" width="1.000026" id="rect5765-9" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="36.999847" height="2.0999999" width="1" id="rect5765-9-4" style="fill:#000000;fill-opacity:1" /><rect y="1037.3622" x="40.799999" height="5" width="1.2" id="rect5822" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="45" height="2.0999999" width="1.000026" id="rect5763-5" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="49.000103" height="2.0999999" width="1.000026" id="rect5765-7" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="53.000206" height="2.0999999" width="1.000026" id="rect5765-9-9" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="56.999847" height="2.0999999" width="1" id="rect5765-9-4-2" style="fill:#000000;fill-opacity:1" /><rect y="1037.3622" x="60.799999" height="5" width="1.2" id="rect5822-6" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="65" height="2.0999999" width="1.000026" id="rect5763-5-2" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="69.000107" height="2.0999999" width="1.000026" id="rect5765-7-5" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="73.000206" height="2.0999999" width="1.000026" id="rect5765-9-9-0" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="76.999847" height="2.0999999" width="1" id="rect5765-9-4-2-3" style="fill:#000000;fill-opacity:1" /><rect y="1037.3622" x="80.800003" height="5" width="1.2" id="rect5822-6-5" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="85.000008" height="2.0999999" width="1.000026" id="rect5763-5-2-9" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="89.000114" height="2.0999999" width="1.000026" id="rect5765-7-5-9" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="93.000214" height="2.0999999" width="1.000026" id="rect5765-9-9-0-0" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="96.999855" height="2.0999999" width="1" id="rect5765-9-4-2-3-5" style="fill:#000000;fill-opacity:1" /><rect y="1037.3622" x="100.8" height="5" width="1.2" id="rect5822-6-5-4" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="105.00002" height="2.0999999" width="1.000026" id="rect5763-5-2-9-6" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="109.00013" height="2.0999999" width="1.000026" id="rect5765-7-5-9-9" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="113.00023" height="2.0999999" width="1.000026" id="rect5765-9-9-0-0-8" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="116.99986" height="2.0999999" width="1" id="rect5765-9-4-2-3-5-0" style="fill:#000000;fill-opacity:1" /><rect y="1037.3622" x="120.8" height="5" width="1.2" id="rect5822-6-5-4-7" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="125.00002" height="2.0999999" width="1.000026" id="rect5763-5-2-9-6-9" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="129.00012" height="2.0999999" width="1.000026" id="rect5765-7-5-9-9-9" style="fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="133.00023" height="2.0999999" width="1.000026" id="rect5765-9-9-0-0-8-0" style="opacity:0;fill:#000000;fill-opacity:1" /><rect y="1037.2622" x="136.99986" height="2.0999999" width="1" id="rect5765-9-4-2-3-5-0-5" style="opacity:0;fill:#000000;fill-opacity:1" /><rect y="1036.6622" x="21.204855" height="0.40000001" width="8.8000002" id="rect6036" style="fill:#000000;fill-opacity:1" /><rect y="1036.9623" x="21.206226" height="5.4000001" width="0.3491767" id="rect6036-5" style="fill:#000000;fill-opacity:1" /><rect transform="scale(-1,1)" y="1036.6621" x="-141.80486" height="0.40000001" width="8.8000002" id="rect6036-2" style="fill:#000000;fill-opacity:1" /><rect transform="scale(-1,1)" y="1036.9622" x="-141.80486" height="5.4000001" width="0.40000001" id="rect6036-5-2" style="fill:#000000;fill-opacity:1" /><text id="label10" y="1044.4059" x="21.174191" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2px;line-height:100%;font-family:Sans;-inkscape-font-specification:Sans;text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:middle;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan y="1044.4059" x="21.174191" id="tspan3851">extrem</tspan><tspan id="tspan3853" y="1046.4059" x="21.174191">schlecht</tspan></text><text id="label20" y="1044.5059" x="41.174191" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2px;line-height:100%;font-family:Sans;-inkscape-font-specification:Sans;text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:middle;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan id="tspan3853-8" y="1044.5059" x="41.174191">schlecht</tspan></text><text id="label30" y="1044.6182" x="61.267941" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2px;line-height:100%;font-family:Sans;-inkscape-font-specification:Sans;text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:middle;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan id="tspan3853-8-1" y="1044.6182" x="61.267941">dürftig</tspan></text><text id="label40" y="1044.6058" x="81.267944" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2px;line-height:100%;font-family:Sans;-inkscape-font-specification:Sans;text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:middle;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan x="81.267944" id="tspan3853-8-1-6" y="1044.6058">ordentlich</tspan></text><text id="label50" y="1044.4182" x="101.4683" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2px;line-height:100%;font-family:Sans;-inkscape-font-specification:Sans;text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:middle;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan id="tspan3853-8-1-6-0" y="1044.4182" x="101.4683">gut</tspan></text><text id="label60" y="1044.5182" x="121.25037" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2px;line-height:100%;font-family:Sans;-inkscape-font-specification:Sans;text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:middle;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan id="tspan3853-8-1-6-04" y="1044.5182" x="121.25037">ausgezeichnet</tspan></text><text id="label70" y="1044.5059" x="141.63435" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2px;line-height:100%;font-family:Sans;-inkscape-font-specification:Sans;text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:middle;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan id="tspan3853-8-1-6-04-3" y="1044.5059" x="141.63435">ideal</tspan></text><text id="text4253" y="1060.8917" x="39.858795" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:8px;line-height:125%;font-family:Arial;-inkscape-font-specification:"Arial, Normal";text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:middle;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" xml:space="preserve"><tspan y="1060.8917" x="39.858795" id="tspan4255" /></text></g><g style="display:inline" transform="translate(7.8951471,6.3219508)" id="layer3"><ellipse id="12" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="5.4548545" cy="1.5720948" rx="1" ry="2.5" /><ellipse id="13" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="7.5048547" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="14" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="9.5048542" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="15" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="11.504855" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="16" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="13.504855" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="17" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="15.504855" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="18" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="17.504854" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="19" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="19.504854" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="20" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="21.404854" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="22" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="25.454855" cy="1.5720948" rx="1" ry="2.5" /><ellipse id="23" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="27.504854" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="24" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="29.504854" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="25" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="31.504854" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="26" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="33.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="27" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="35.504856" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="28" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="37.504856" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="29" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="39.504856" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="30" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="41.404854" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="21" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="23.354855" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="32" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="45.454853" cy="1.5720948" rx="1" ry="2.5" /><ellipse id="33" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="47.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="34" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="49.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="35" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="51.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="36" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="53.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="37" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="55.504856" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="38" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="57.504856" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="39" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="59.504856" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="40" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="61.404854" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="31" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="43.354855" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="42" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="65.454857" cy="1.5720948" rx="1" ry="2.5" /><ellipse id="43" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="67.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="44" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="69.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="45" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="71.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="46" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="73.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="47" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="75.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="48" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="77.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="49" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="79.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="50" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="81.404854" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="41" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="63.354855" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="52" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="85.454857" cy="1.5720948" rx="1" ry="2.5" /><ellipse id="53" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="87.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="54" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="89.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="55" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="91.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="56" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="93.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="57" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="95.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="58" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="97.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="59" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="99.504852" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="60" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="101.40485" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="51" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="83.354858" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="62" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="105.50486" cy="1.5720948" rx="1" ry="2.5" /><ellipse id="63" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="107.55486" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="64" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="109.55486" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="65" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="111.55486" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="66" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="113.55486" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="67" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="115.55486" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="68" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="117.55486" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="69" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="119.55486" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="70" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="121.55486" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="61" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="103.40485" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="11" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="3.4048545" cy="1.5720948" rx="0.94999999" ry="2.5" /><ellipse id="10" style="opacity:0;fill:#000000;fill-opacity:0.45871558" cx="1.4048545" cy="1.5720948" rx="0.94999999" ry="2.5" /></g><g transform="translate(7.0000016,5.4565456)" style="display:inline" id="layer4"><path id="cross" d="M 3.666497,-0.09404561 C 0.69774682,2.8434544 0.69774682,2.8434544 0.69774682,2.8434544 L 2.2289971,1.3747044 0.72899682,-0.15654561 3.697747,2.8434544" style="fill:none;stroke:#000000;stroke-width:0.60000002;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /></g></svg>';

        if (this.labels instanceof Array && this.labels.length === 7) {
            TheFragebogen.logger.debug(this.constructor.name + "._setupSVG()", "Using custom labels: " + this.labels);

            this.scaleImage.getElementById("label10").textContent = this.labels[0];
            this.scaleImage.getElementById("label20").textContent = this.labels[1];
            this.scaleImage.getElementById("label30").textContent = this.labels[2];
            this.scaleImage.getElementById("label40").textContent = this.labels[3];
            this.scaleImage.getElementById("label50").textContent = this.labels[4];
            this.scaleImage.getElementById("label60").textContent = this.labels[5];
            this.scaleImage.getElementById("label70").textContent = this.labels[6];
        } else {
            TheFragebogen.logger.info(this.constructor.name + "._setupSVG()", "Using default scale labels.");
        }
    }

    _getAnswerElements() {
        return this.scaleImage.getElementsByTagName("ellipse");
    }

    getAnswerOptions() {
        return "10-70";
    }
}

/**
A QuestionnaireItem presenting a Visual Analogue Scale (100pt).

@class QuestionnaireItemSVGVisualAnalogueScale
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSVG
*/
class QuestionnaireItemSVGVisualAnalogueScale extends QuestionnaireItemSVG {

    /**
    @param {string} [className] CSS class
    @param {string} question
    @param {boolean} [required=false]

    @param {string} [captionRight] The caption of the left label.
    @param {string} [captionLeft] The caption of the right label.
    */
    constructor(className, question, required, captionLeft, captionRight) {
        super(className, question, required);

        this.captionLeft = captionLeft;
        this.captionRight = captionRight;
    }

    _setupSVG() {
        this.scaleImage.setAttribute("viewBox", "0 2 170 19.39");
        this.scaleImage.innerHTML = '<?xml version="1.0" encoding="utf-8" standalone="no"?><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="170" height="19.389999" id="svg5198" version="1.1"><defs id="defs5200" /><metadata id="metadata5203"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /><dc:title /></cc:Work></rdf:RDF></metadata><g style="display:inline" transform="translate(-12.104855,-1032.0442)" id="layer1"><rect y="1041.6211" x="36.598698" height="0.84977901" width="120.59571" id="rect5206" style="fill:#000000;fill-opacity:1" /><rect y="1042.6252" x="40.371223" height="2.0999999" width="1.000026" id="rect5763" style="opacity:0;fill:#000000;fill-opacity:1" /><rect y="1042.6252" x="44.371326" height="2.0999999" width="1.000026" id="rect5765" style="opacity:0;fill:#000000;fill-opacity:1" /><rect y="1042.6252" x="148.37146" height="2.0999999" width="1.000026" id="rect5765-9-9-0-0-8-0" style="opacity:0;fill:#000000;fill-opacity:1" /><rect y="1042.6252" x="152.37109" height="2.0999999" width="1" id="rect5765-9-4-2-3-5-0-5" style="opacity:0;fill:#000000;fill-opacity:1" /><text transform="translate(12.104855,1032.0442)" id="text4739" y="18.240952" x="6.717514" style="font-style:normal;font-weight:normal;font-size:40px;line-height:125%;font-family:Sans;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan y="18.240952" x="6.717514" id="tspan4741" /></text><text id="labelLeft" y="1043.1372" x="34.33847" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:3.75px;line-height:100%;font-family:Sans;text-align:end;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:end;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:3.75px;line-height:100%;font-family:Sans;-inkscape-font-specification:"Sans, Normal";text-align:end;writing-mode:lr-tb;text-anchor:end" id="tspan3853" y="1043.1372" x="34.33847">left</tspan></text><text id="labelRight" y="1042.7738" x="158.26675" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:3.75px;line-height:100%;font-family:Sans;text-align:start;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:start;display:inline;fill:#000000;fill-opacity:1;stroke:none" xml:space="preserve"><tspan style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:3.75px;line-height:100%;font-family:Sans;-inkscape-font-specification:"Sans, Normal";text-align:start;writing-mode:lr-tb;text-anchor:start" id="tspan3853-3" y="1042.7738" x="158.26675">right</tspan></text></g><g id="g3179" transform="translate(7.8951471,4.3179676)" style="display:inline"><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="52" cx="67.923729" cy="4.8909831" rx="0.60754085" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="53" cx="69.169189" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="54" cx="70.38427" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="55" cx="71.599358" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="56" cx="72.814438" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="57" cx="74.029518" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="58" cx="75.244598" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="59" cx="76.459679" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="60" cx="77.614006" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="62" cx="80.074547" cy="4.8909831" rx="0.60754085" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="63" cx="81.320007" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="64" cx="82.535088" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="65" cx="83.750168" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="66" cx="84.965248" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="67" cx="86.180328" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="68" cx="87.395416" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="69" cx="88.610497" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="70" cx="89.764824" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="61" cx="78.798714" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="72" cx="92.225365" cy="4.8909831" rx="0.60754085" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="73" cx="93.470825" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="74" cx="94.685905" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="75" cx="95.900986" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="76" cx="97.116066" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="77" cx="98.331146" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="78" cx="99.546227" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="79" cx="100.76131" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="80" cx="101.91564" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="71" cx="90.949532" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="82" cx="104.37618" cy="4.8909831" rx="0.60754085" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="83" cx="105.62164" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="84" cx="106.83672" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="85" cx="108.0518" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="86" cx="109.26688" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="87" cx="110.48196" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="88" cx="111.69704" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="89" cx="112.91213" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="90" cx="114.06646" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="81" cx="103.10034" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="92" cx="116.527" cy="4.8909831" rx="0.60754085" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="93" cx="117.77245" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="94" cx="118.98756" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="95" cx="120.20262" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="96" cx="121.41772" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="97" cx="122.63278" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="98" cx="123.84787" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="99" cx="125.06295" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="100" cx="126.21729" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="91" cx="115.25116" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="102" cx="128.70819" cy="4.8909831" rx="0.60754085" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="103" cx="129.95364" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="104" cx="131.16875" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="105" cx="132.38382" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="106" cx="133.59892" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="107" cx="134.81398" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="108" cx="136.02905" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="109" cx="137.24414" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="101" cx="127.43235" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="51" cx="66.678268" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="50" cx="65.463188" cy="4.8909831" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="12" cx="19.137701" cy="4.9351368" rx="0.60754085" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="13" cx="20.383158" cy="4.9351363" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="14" cx="21.59824" cy="4.9351363" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="15" cx="22.813322" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="16" cx="24.028404" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="17" cx="25.243486" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="18" cx="26.458567" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="19" cx="27.673649" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="20" cx="28.827976" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="22" cx="31.288517" cy="4.9351368" rx="0.60754085" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="23" cx="32.533978" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="24" cx="33.749058" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="25" cx="34.964138" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="26" cx="36.179222" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="27" cx="37.394302" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="28" cx="38.609386" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="29" cx="39.824467" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="30" cx="40.978794" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="21" cx="30.012684" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="33" cx="44.776421" cy="4.8909426" rx="0.60754085" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="34" cx="46.021881" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="35" cx="47.236961" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="36" cx="48.452042" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="37" cx="49.667126" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="38" cx="50.882206" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="39" cx="52.097286" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="40" cx="53.31237" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="41" cx="54.466698" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="32" cx="43.500587" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.1714536;stroke-miterlimit:4;stroke-dasharray:none" id="43" cx="56.927238" cy="4.8909426" rx="0.60754085" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="44" cx="58.172695" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="45" cx="59.387779" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="46" cx="60.602859" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="47" cx="61.817944" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="48" cx="63.033028" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="49" cx="64.248108" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="42" cx="55.651402" cy="4.8909426" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="11" cx="17.892241" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="10" cx="16.677158" cy="4.9351368" rx="0.57716382" ry="2.5" /><ellipse style="display:inline;opacity:0;fill:#000000;fill-opacity:1;stroke-width:1.20188606;stroke-miterlimit:4;stroke-dasharray:none" id="31" cx="42.190598" cy="4.9004354" rx="0.57716382" ry="2.5" /></g><g transform="translate(7.0000016,3.4525612)" style="display:inline" id="layer4"><path id="cross" d="m 19.355597,5.0112288 c -2.96875,2.9375 -2.96875,2.9375 -2.96875,2.9375 l 1.53125,-1.46875 -1.5,-1.53125 2.96875,3" style="display:inline;fill:none;stroke:#000000;stroke-width:0.60000002;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /></g></svg>';

        this.scaleImage.getElementById("labelLeft").textContent = this.captionLeft;
        this.scaleImage.getElementById("labelRight").textContent = this.captionRight;
    }

    _getAnswerElements() {
        return this.scaleImage.getElementsByTagName("ellipse");
    }

    getAnswerOptions(data) {
        return "10-109";
    }
}

/**
A QuestionnaireItem that gives a _constant_ answer.
Useful for store information that are useful in the data to be exported.

@class QuestionnaireItemSystemConst
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSystem
*/
class QuestionnaireItemSystemConst extends QuestionnaireItemSystem {

    /**
    @param {string} question First slot for information.
    @param {string} content Second slot for information.
    */
    constructor(question, content) {
        super(null, question, false);
        this.content = content;
    }

    createUI() {
        super.createUI();
        this.setAnswer(this.content);
    }
}

/**
A QuestionnaireItemSystem that reports statistics on how long the focus was lost or gained.

Reports as an array of tuples [[inFocus, ms], ...].
Each item states how long the survey was under focus (inFocus = true) or how long the focus was lost (inFocus = false).
This QuestionnaireItemSystemFocus uses windows.addEventListener and windows.removeEventListener to listen for new events.
All event listeners are attached as non-capturing.

@class QuestionnaireItemSystemFocus
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSystem
*/
class QuestionnaireItemSystemFocus extends QuestionnaireItemSystem {

    constructor() {
        super(null, "Focus", false);

        this.timeOfLastFocusEvent = null;
        this.inFocus = null;

        this.onLostFocus = ["blur", () => this._onFocusChanged(false), false];
        this.onGainedFocus = ["focus", () => this._onFocusChanged(true), false];
    }

    createUI() {
        super.createUI();
        this.timeOfLastFocusEvent = new Date().getTime();
        this.inFocus = null; // Current state of the focus is unknown

        window.addEventListener(...this.onLostFocus);
        window.addEventListener(...this.onGainedFocus);
    }

    releaseUI() {
        super.releaseUI();

        window.removeEventListener(...this.onLostFocus);
        window.removeEventListener(...this.onGainedFocus);

        this.inFocus = this.inFocus === null ? true : this.inFocus; // Focus might have never changed, so it could still be null
        const newAnswer = this._getAnswer();
        newAnswer.push([this.inFocus, new Date().getTime() - this.timeOfLastFocusEvent]);
        this.setAnswer(newAnswer);
    }

    _onFocusChanged(gotFocus) {
        // Blur event can be triggered multiple times in a row
        if (gotFocus !== this.inFocus) {
            const newAnswer = this._getAnswer();
            newAnswer.push([gotFocus, new Date().getTime() - this.timeOfLastFocusEvent]);
            this.setAnswer(newAnswer);
            this.inFocus = gotFocus;
            this.timeOfLastFocusEvent = new Date().getTime();
        }
    }

    getAnswer() {
        return super.getAnswer();
    }

    _getAnswer() {
        return this.getAnswer() || [];
    }
}

/**
A QuestionnaireItemSystem that stores the current date time when this element was used, i.e., `createUI()` called.
The answer is the time and date when the function createUI() is called.

@class QuestionnaireItemSystemScreenDateTime
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSystem
*/
class QuestionnaireItemSystemScreenDateTime extends QuestionnaireItemSystem {

    constructor() {
        super(null, "DateTime", false);
    }

    createUI() {
        super.createUI();
        this.setAnswer(new Date());
    }
}

/**
A QuestionnaireItemSystem that stores the time it was shown, i.e., createUI() and releaseUI().

Reports in milliseconds.

@class QuestionnaireItemSystemScreenDuration
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSystem
*/
class QuestionnaireItemSystemScreenDuration extends QuestionnaireItemSystem {

    constructor() {
        super(null, "Screen Duration", false);
        this.startTime = null;
    }

    createUI() {
        super.createUI();
        this.startTime = new Date().getTime();
    }

    releaseUI() {
        super.releaseUI();
        this.setAnswer(new Date().getTime() - this.startTime);
    }
}

/**
A QuestionnaireItem that stores the current URL of the web browser.

@class QuestionnaireItemSystemURL
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSystem
@augments QuestionnaireItemSystemConst
*/
class QuestionnaireItemSystemURL extends QuestionnaireItemSystem {

    constructor() {
        super(undefined, "URL", false);
    }

    createUI() {
        super.createUI();
        this.setAnswer(window.location.href);
    }
}

/**
A QuestionnaireItemSystem that stores the dimension of the viewport.

Reports the viewport as array [document.documentElement.clientWidth, document.documentElement.clientHeight] in pixels.
It gets measured at the time of createUI().

@class QuestionnaireItemSystemViewportSize
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSystem
*/
class QuestionnaireItemSystemViewportSize extends QuestionnaireItemSystem {

    constructor() {
        super(null, "Viewport size", false);
    }

    createUI() {
        super.createUI();
        this.setAnswer([document.documentElement.clientWidth, document.documentElement.clientHeight]);
    }
}

/**
A QuestionnaireItemSystem that waits for a defined number of seconds before setting itself ready.

No UI is displayed.

@class QuestionnaireItemSystemWait
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemSystem
*/
class QuestionnaireItemSystemWait extends QuestionnaireItemSystem {

    /**
    @param {number} waitTime waiting time in milliseconds
    */
    constructor(waitTime) {
        super(null, "", true);
        this.waitTime = waitTime;

        this.timeoutHandle = null;

        TheFragebogen.logger.debug(this.constructor.name + "()", "Set: waitTime as " + this.waitTime);
    }

    createUI() {
        this.timeoutHandle = setTimeout(() => this._waitTimeCallback(), this.waitTime);
    }

    _waitTimeCallback() {
        this.setAnswer(this.waitTime);
    }

    releaseUI() {
        super.releaseUI();
        if (this.timeoutHandle !== null) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = null;
        }
    }
}

/**
A QuestionnaireItemMediaAudio that adds a repeat button to the audio
For other details see {@link QuestionnaireItemMediaAudio}.

@class QuestionnaireItemMediaAudioRepeatable
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemMedia
@augments QuestionnaireItemMediaAudio
*/
class QuestionnaireItemMediaAudioRepeatable extends QuestionnaireItemMediaAudio {

    /**
    @param {string} [className] CSS class
    @param {string} [question]
    @param {boolean} [required=false]
    @param {string|array<string>} url The URL of the media element to be loaded; if supported by the browser also data URI.
    @param {boolean} required Element must report ready before continue.
    @param {boolean} [readyOnError=true] Sets ready=true if an error occures.
    @param {string} buttonCaption The string shown in the replay button.
    */
    constructor(className, question, required, url, readyOnError, buttonCaption) {
        super(className, question, required, url, readyOnError);

        this.buttonCaption = buttonCaption;
    }

    _createAnswerNode() {
        const answerNode = super._createAnswerNode();

        var div = document.createElement("div");
        var button = document.createElement("button");
        button.innerHTML = this.buttonCaption;
        button.onclick = () => this._onReplayClick();

        div.appendChild(button);
        answerNode.appendChild(div);

        return answerNode;
    }

    _onReplayClick() {
        this.replay();
    }
}

/**
A QuestionnaireItemMediaVideo that adds a repeat button to the video.
For other details see {@link QuestionnaireItemMediaVideo}.

@class QuestionnaireItemMediaVideoRepeatable
@augments UIElement
@augments UIElementInteractive
@augments QuestionnaireItem
@augments QuestionnaireItemMedia
@augments QuestionnaireItemMediaVideo
*/
class QuestionnaireItemMediaVideoRepeatable extends QuestionnaireItemMediaVideo {

    /**
    @param {string} [className] CSS class
    @param {string} [question]
    @param {boolean} [required=false]
    @param {string|array<string>} url The URL of the media element to be loaded; if supported by the browser also data URI.
    @param {boolean} required Element must report ready before continue.
    @param {boolean} [readyOnError=true] Sets ready=true if an error occures.
    @param {string} buttonCaption The string shown in the replay button.
    */
    constructor(className, question, required, url, readyOnError, buttonCaption) {
        super(className, question, required, url, readyOnError);

        this.buttonCaption = buttonCaption;
    }

    _createAnswerNode() {
        const answerNode = super._createAnswerNode();

        var div = document.createElement("div");
        var button = document.createElement("button");
        button.innerHTML = this.buttonCaption;
        button.onclick = () => this._onReplayClick();

        div.appendChild(button);
        answerNode.appendChild(div);

        return answerNode;
    }

    _onReplayClick() {
        this.replay();
    }
}
