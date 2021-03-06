const Chart = require("chart.js")
const path = require("path")
const { remote } = require('electron')
const fileHandler = remote.require(path.join(remote.app.getAppPath(), "src", "backend", "fileHandler.js"));
const chartDataLabels = require("chartjs-plugin-datalabels");

const toDate = document.getElementById("toDate") 
const fromDate = document.getElementById("fromDate")

fromDate.valueAsDate = new Date(0);
toDate.valueAsDate = new Date();

Chart.plugins.register(chartDataLabels)

let labelSelection = document.getElementsByTagName("label")
for (let i = 0; i < labelSelection.length; i++) {
    const label = labelSelection[i];
    if (label.className) {
        label.innerHTML = fileHandler.resolveLanguageCode(label.className, navigator.language)
    }
}


var ctx = document.getElementById('chart').getContext('2d');

const myChart = new Chart(ctx, {
    plugins: [chartDataLabels],
    type: 'line',
    options: {
        plugins: {
            datalabels: {
                anchor: "center",
                align: "start",
                offset: 10,
                font: {
                    weight: 600,
                    size: getFontSize(),
                },
                color: "black"
            }
        },
        responsive: true,
        responsiveAnimationDuration: 1000,
        legend: {
            onClick: function () {},
            display: false
        },
        scales: {
            yAxes: [{
                ticks: {
                    min: 0
                }
            }]
        }        
    }
});

myChart.data = resolveData()
myChart.update()

fromDate.addEventListener("change", () => {
    if (new Date(fromDate.valueAsDate) > new Date(toDate.valueAsDate)) {
        fromDate.valueAsDate = toDate.valueAsDate
        return;
    }
    myChart.data = resolveData()
    myChart.update()
})

toDate.addEventListener("change", () => {
    if (new Date(fromDate.valueAsDate) > new Date(toDate.valueAsDate)) {
        toDate.valueAsDate = fromDate.valueAsDate
        return;
    }
    myChart.data = resolveData()
    myChart.update()
})

function getRandomColor() {
    let colors = ["FF2D00", "FEFF00", "67FF00", "00FFB1", "0078FF", "0078FF",
                "D400FF", "FF00A6"]
    if (myChart)
        if (myChart.config.type === "line") 
            return "#" + colors.splice(Math.floor(Math.random() * colors.length), 1)[0]
        else {
            return getRandom(colors, 
                myChart.config.data.labels.length).map(a => "#" + a)
        }
    else    
        return "#" + colors.splice(Math.floor(Math.random() * colors.length), 1)[0]
    
}

window.addEventListener("resize", fontSize)

var radios = document.querySelectorAll("input[type=radio]")
for(let i = 0; i < radios.length; i++) {
    if (radios[i].name === "chartType")
        radios[i].onclick = function() {
            if (radios[i].checked) {
                myChart.config.type = radios[i].value
                if (radios[i].value === "pie") {
                    myChart.config.options.scales.xAxes[0].display = false;
                    myChart.config.options.scales.yAxes[0].display = false;
                } else {
                    myChart.config.options.scales.xAxes[0].display = true;
                    myChart.config.options.scales.yAxes[0].display = true;
                }

                if (radios[i].value === "bar") {
                    myChart.config.options.plugins.datalabels.display = false;
                } else {
                    myChart.config.options.plugins.datalabels.display = true;
                }

                myChart.config.data.datasets[0].backgroundColor = getRandomColor()
                myChart.update()
            }
        }
}

function fontSize () {
    let fontSize = parseInt(window.innerWidth * 0.03)
    fontSize = fontSize>25?25:fontSize<12?12:fontSize
    myChart.options["legend"]["labels"]["fontSize"] = fontSize
    myChart.options["scales"]["xAxes"][0]["ticks"]["fontSize"] = fontSize
    myChart["options"].plugins.datalabels.font.size = fontSize * .8
}

function getFontSize() {
    let fontSize = parseInt(window.innerWidth * 0.03)
    fontSize = fontSize>25?25:fontSize<12?12:fontSize
    return fontSize
}

/**
 * 
 * @param {Array} arr 
 * @param {Number} n
 * @returns {Array} 
 */
function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

/**
 * @param {Date} date
 */
function resolveData() {
    let item = fileHandler.getSpendingsFromDates(new Date(fromDate.valueAsDate), new Date(toDate.valueAsDate))
    let keys = Object.keys(item)
    let sort = []
    for (let i = 0; i < keys.length; i++) {
        sort.push({
            "label": fileHandler.resolveCategory(keys[i], navigator.language),
            "value": item[keys[i]]
        })
    }
        
    sort.sort((a,b) => a.value - b.value)
    let labels = []
    let numbers = []
    sort.forEach(item => {
        labels.push(item.label)
        numbers.push(item.value)
    })

    return {
        labels: labels,
        datasets: [{
            data: numbers,
            backgroundColor: getRandomColor(),
            borderColor: [
                'rgba(255, 99, 132, 0.2)'
            ],
            pointBackgroundColor: "black",
            borderWidth: 1,
            barPercentage: 1
        }]
    };
}