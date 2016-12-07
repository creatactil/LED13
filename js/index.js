/* jshint quotmark: false, unused: vars, browser: true */
/* global cordova, console, $, bluetoothSerial,refreshButton, deviceList, disconnectButton, connectionScreen, messageDiv, led13ButtonON,led13ButtonOFF */
'use strict';

var app = {
  initialize: function() {
    this.bind();
  },
  bind: function() {
    document.addEventListener('deviceready', this.deviceready, false);
    colorScreen.hidden = true;
  },
  deviceready: function() {

    // wire buttons to functions
    deviceList.ontouchstart = app.connect; // assume not scrolling
    refreshButton.ontouchstart = app.list;
    disconnectButton.ontouchstart = app.disconnect;
    led13ButtonON.ontouchstart = app.LED13ON;
    led13ButtonOFF.ontouchstart = app.LED13OFF;


    // throttle changes
    var throttledOnColorChange = _.throttle(app.onColorChange, 200);
    $('input').on('change', throttledOnColorChange);

    app.list();
  },
  list: function(event) {
    deviceList.firstChild.innerHTML = "Discovering...";
    app.setStatus("Looking for Bluetooth Devices...");

    bluetoothSerial.list(app.ondevicelist, app.generateFailureFunction("List Failed"));
  },
  connect: function(e) {
    app.setStatus("Connecting...");
    var device = e.target.getAttribute('deviceId');
    console.log("Requesting connection to " + device);
    bluetoothSerial.connect(device, app.onconnect, app.ondisconnect);
  },
  disconnect: function(event) {
    if (event) {
      event.preventDefault();
    }

    app.setStatus("Disconnecting...");
    bluetoothSerial.disconnect(app.ondisconnect);
  },
  onconnect: function() {
    connectionScreen.hidden = true;
    colorScreen.hidden = false;
    app.setStatus("Connected.");
  },
  ondisconnect: function() {
    connectionScreen.hidden = false;
    colorScreen.hidden = true;
    app.setStatus("Disconnected.");
  },

  LED13ON: function() {
    bluetoothSerial.write("b");
  },
  LED13OFF: function() {
    bluetoothSerial.write("c");
  }
  sendToArduino: function(c) {
    bluetoothSerial.write("c" + c + "\n");
    // bluetoothSerial.write(1);
  },
  timeoutId: 0,
  setStatus: function(status) {
    if (app.timeoutId) {
      clearTimeout(app.timeoutId);
    }
    messageDiv.innerText = status;
    app.timeoutId = setTimeout(function() {
      messageDiv.innerText = "";
    }, 4000);
  },
  ondevicelist: function(devices) {
    var listItem, deviceId;

    // remove existing devices
    deviceList.innerHTML = "";
    app.setStatus("");

    devices.forEach(function(device) {
      listItem = document.createElement('li');
      listItem.className = "topcoat-list__item";
      if (device.hasOwnProperty("uuid")) { // TODO https://github.com/don/BluetoothSerial/issues/5
        deviceId = device.uuid;
      } else if (device.hasOwnProperty("address")) {
        deviceId = device.address;
      } else {
        deviceId = "ERROR " + JSON.stringify(device);
      }
      listItem.setAttribute('deviceId', device.address);
      listItem.innerHTML = device.name + "<br/><i>" + deviceId + "</i>";
      deviceList.appendChild(listItem);
    });

    if (devices.length === 0) {

      if (cordova.platformId === "ios") { // BLE
        app.setStatus("No Bluetooth Peripherals Discovered.");
      } else { // Android
        app.setStatus("Please Pair a Bluetooth Device.");
      }

    } else {
      app.setStatus("Found " + devices.length + " device" + (devices.length === 1 ? "." : "s."));
    }
  },
  generateFailureFunction: function(message) {
    var func = function(reason) {
      var details = "";
      if (reason) {
        details += ": " + JSON.stringify(reason);
      }
      app.setStatus(message + details);
    };
    return func;
  }
};
