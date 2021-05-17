const StreamrClient = require("streamr-client");
const fs = require("fs");

const client = new StreamrClient({
  auth: {
    privateKey:
      "2676f1a2ebbaef35196d9907f28f07dce55a12a9578a2c50077302192b84a155",
  },
});

var memInfo = {};
var currentCPUInfo = { total: 0, active: 0 };
var lastCPUInfo = { total: 0, active: 0 };

const getValFromLine = (line) => {
  var match = line.match(/[0-9]+/gi);
  if (match !== null) return parseInt(match[0]);
  else return null;
}

const calculateCPUPercentage = (oldVals, newVals) => {
  var totalDiff = newVals.total - oldVals.total;
  var activeDiff = newVals.active - oldVals.active;
  return Math.ceil((activeDiff / totalDiff) * 100);
};

const getCPUInfo = () => {
  lastCPUInfo.active = currentCPUInfo.active;
  lastCPUInfo.idle = currentCPUInfo.idle;
  lastCPUInfo.total = currentCPUInfo.total;

  fs.readFile("/proc/stat", "utf8", function (err, data) {
    var lines = data.split("\n");
    var cpuTimes = lines[0].match(/[0-9]+/gi);
    currentCPUInfo.total = 0;
    // We'll count both idle and iowait as idle time
    currentCPUInfo.idle = parseInt(cpuTimes[3]) + parseInt(cpuTimes[4]);
    for (var i = 0; i < cpuTimes.length; i++) {
      currentCPUInfo.total += parseInt(cpuTimes[i]);
    }
    currentCPUInfo.active = currentCPUInfo.total - currentCPUInfo.idle;
    currentCPUInfo.percentUsed = calculateCPUPercentage(
      lastCPUInfo,
      currentCPUInfo
    );

    console.log("Current CPU Usage: " + currentCPUInfo.percentUsed + "%");

    client.publish("0x3c334501a3faa9344f8f42b65567157b8a388ea0/rpi-cpu", {
      cpuUsage: "Current CPU Usage: " + currentCPUInfo.percentUsed + "%",
    });
  });
};

setInterval(getCPUInfo, 1000);
