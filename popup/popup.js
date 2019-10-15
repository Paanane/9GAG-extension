let slider = document.querySelector("#volume");
let volume = document.querySelector(".volume_icon");
let controls = document.querySelector("#controls");

let mute = false;

let getTabs = function() {
    return browser.tabs.query({
        url: "https://9gag.com/*"
    });
};

let handleResults = function(tabs) {
    tabs.forEach(tab => browser.tabs.sendMessage(tab.id, {
        "volume":   slider.value,
        "mute":    mute,
        "controls": controls.checked
    }));
};

let handleErrors = function(error) {
    console.log("[ERROR]: " + error);
};

let handleData = function() {
    getTabs().then(handleResults, handleErrors);
};

slider.addEventListener("input", function() {
    handleData();
});

volume.addEventListener("click", function() {
    mute = mute === false;
    volume.innerHTML = mute ? "volume_off" : "volume_up";
    handleData();

});

controls.addEventListener(`click`, function() {
    handleData();
});

browser.storage.local.get(["volume", "controls", "mute"])
    .then(function(settings) {
        slider.value = settings.volume;
        mute = settings.mute === undefined ? false : settings.mute;
        volume.innerHTML = mute ? "volume_off" : "volume_up";
        controls.checked = settings.controls;
    });