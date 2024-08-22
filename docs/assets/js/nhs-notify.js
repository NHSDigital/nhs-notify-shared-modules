// Quick poc for view full screen

window.addEventListener("load", (event) => {
  var fullScreenParamName = "fullscreen";
  var urlParams = new URLSearchParams(document.location.search);
  var param = urlParams.get(fullScreenParamName);
  if (param) {
    tempViewFullScreen();
  } else {
    setViewAtStart();
  }
});

let nhsNotify = nhsNotifyDefaults();

function nhsNotifyDefaults() {
  var defaults = {};
  defaults.storageName = "cb-checked";
  defaults.buttonName = "fullScreenButton";
  defaults.standard = "Standard";
  defaults.fullScreen = "Full Screen";
  return defaults;
}

function tempViewFullScreen() {
  viewFullScreen();
  var buttons = document.getElementsByName(nhsNotify.buttonName);
  buttons.forEach((item) => {
    item.style.display = "none";
  });
}

function viewFullScreen() {
  var sideBar = document.getElementsByClassName("side-bar")[0];
  var main = document.getElementsByClassName("main")[0];
  var pageInfo = document.getElementsByClassName("page-info")[0];
  sideBar.style.display = "none";
  main.style.maxWidth = "100%";
  main.style.marginLeft = "0px";
  if (pageInfo) pageInfo.style.display = "none";
}
function setFullScreen() {
  viewFullScreen();
  afterChange(nhsNotify.standard, nhsNotify.fullScreen);
}

function setStandard() {
  var sideBar = document.getElementsByClassName("side-bar")[0];
  var main = document.getElementsByClassName("main")[0];
  var pageInfo = document.getElementsByClassName("page-info")[0];
  sideBar.style.display = "";
  main.style.maxWidth = "";
  main.style.marginLeft = "";
  if (pageInfo) pageInfo.style.display = "";
  afterChange(nhsNotify.fullScreen, nhsNotify.standard);
}

function setViewAtStart() {
  var currentStatus = localStorage.getItem(nhsNotify.storageName);
  if (currentStatus == nhsNotify.fullScreen) makeChange(currentStatus);
}

function makeChange(newStatus) {
  if (newStatus == nhsNotify.fullScreen) {
    setFullScreen();
  } else {
    setStandard();
  }
}

function afterChange(currentStatus, newStatus) {
  var storageName = nhsNotify.storageName;
  var buttonName = nhsNotify.buttonName;
  var buttons = document.getElementsByName(buttonName);
  localStorage.setItem(storageName, newStatus);

  buttons.forEach((item) => {
    item.textContent = currentStatus + " View";
  });
}

function fullScreenToggle() {
  var standard = nhsNotify.standard;
  var fullScreen = nhsNotify.fullScreen;
  var storageName = nhsNotify.storageName;
  var currentStatus = "";
  var newStatus = "";

  currentStatus = localStorage.getItem(storageName);

  if (
    currentStatus == "false" ||
    currentStatus == "undefined" ||
    currentStatus == null
  ) {
    currentStatus = standard;
    newStatus = fullScreen;
  }

  if (currentStatus == standard) {
    newStatus = fullScreen;
    currentStatus = standard;
  } else {
    newStatus = standard;
    currentStatus = fullScreen;
  }

  makeChange(newStatus);
}
