const fs = require("fs")
const path = require("path")
const { setTimeout } = require("timers")
const languageList = require("language-list")()
const cache = readCache()

function resolveLanguageCode (className, languageCode) {
    return cache["language"][className]?cache["language"][className][languageCode]?cache["language"][className][languageCode]:cache["language"][className]["en"]:"ClassName not found"
}
    
function resolveCategory (category, languageCode) {
    return cache["categorys"][category]?cache["categorys"][category][languageCode]?cache["categorys"][category][languageCode]:cache["categorys"][category]["en"]:null
}

function removeCategory (category) {
    delete cache["categorys"][category]
    let items = getAllSpendingsArray()
    items.forEach((a,i) => {
        a.forEach((b, n) => {
            if (b["category"] === category) {
                items[i].splice(n, 1)
            }
        })
    })
}

function addJob(type) {
    
}

function checkForUpdate() {
    let now = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
    if (!cache.repeat.hasOwnProperty("jobs"))
        cache.repeat["jobs"] = []
    cache.repeat["jobs"].forEach(job => {
        while (now >= new Date(job["last"] + job["every"])) {
            let date = new Date(job["last"] + job["every"])
            addSpending({
                "date": {
                    "year": date.getFullYear(),
                    "month": date.getMonth()+1,
                    "day": date.getDate()
                },
                "title": job["title"],
                "description": job["description"],
                "category": job["category"],
                "spend": job["amount"]
            })
            job["last"] = date.valueOf()
        }
    })
}

function updateCategory (id, languageCode, value) {
    cache["categorys"][id][languageCode] = value
}

function getCategorys (languageCode) {
    let ret = []
    let categorys = Object.keys(cache.categorys)
    for (let a = 0; a < categorys.length; a++) {
        const categoryObject = cache.categorys[categorys[a]];
        ret.push({
            "value": categorys[a],
            "text": categoryObject[languageCode]?categoryObject[languageCode]:categoryObject["en"]?categoryObject["en"]:null
        })
    }
    return ret;            
}

function addSpending(data) {
    let object = cache.spendings;
    if (!object.hasOwnProperty(data["date"]["year"])) 
        object[data["date"]["year"]] = {}
    if (!object[data["date"]["year"]].hasOwnProperty([data["date"]["month"]])) 
        object[data["date"]["year"]][data["date"]["month"]] = {}
    if (! object[data["date"]["year"]][data["date"]["month"]].hasOwnProperty(data["date"]["day"])) 
        object[data["date"]["year"]][data["date"]["month"]][data["date"]["day"]] = []

    let day = object[data["date"]["year"]][data["date"]["month"]][data["date"]["day"]]
    day.push({
        "title": data["title"],
        "description": data["description"],
        "category": data["category"],
        "spend": parseFloat(data["spend"])
    })
    object[data["date"]["year"]][data["date"]["month"]][data["date"]["day"]] = day;
    saveCache()
}

/**
 * @param {Date} date 
 */
function getDaySpendings(date) {
    let answer = []

    let year = date.getFullYear()
    let month = ("0" + (date.getMonth() + 1)).slice(-2)
    let day = ("0" + date.getDate()).slice(-2)
    if (!checkObject(year, month, day))
        return answer
    cache.spendings[year][month][day].forEach(spending => {
        answer.push(spending)
    })
    return answer
}

/**
 * @param {Date} from 
 * @param {Date} to 
 */
function getSpendingsFromDates(from, to) {
    let dates = getDaysBetween(from, to);
    let spendings = []
    dates.forEach(date => spendings = spendings.concat(getDaySpendings(date)))
    let answer = {}
    spendings.forEach(spending => {
        if (answer[spending["category"]]) {
            answer[spending["category"]] = answer[spending["category"]] + spending["spend"]
        } else
            answer[spending["category"]] = spending["spend"]
    })
    return answer
}

/**
 * @param {Date} from 
 * @param {Date} to 
 * @returns {Array<Date>}
 */
function getDaysBetween(from, to) {
    let dates = []
    while (from.valueOf() <= to.valueOf()) {
        dates.push(from)
        from = new Date(from.valueOf() + (1000 * 60 * 60 * 24))
    }
    return dates;
}

/**
 * @param {Array} translations 
 */
function addCategory(translations) {
    let data = {}
    translations.forEach(translation => {
        data[languageList.getLanguageCode(translation[0])] = translation[1]
    })
    let uuid = uuidv4()
    while (cache.categorys.hasOwnProperty(uuid)) uuid = uuidv4()
    cache.categorys[uuid] = data;
    saveCache()
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function readCache() {
    if (!fs.existsSync(path.join(__dirname, "../", "data", "spendings.json")))
        fs.writeFileSync(path.join(__dirname, "../", "data", "spendings.json"), "{}")
    if (!fs.existsSync(path.join(__dirname, "../", "data", "repeat.json")))
        fs.writeFileSync(path.join(__dirname, "../", "data", "repeat.json"), "{}")
    return {
        "language": JSON.parse(fs.readFileSync(path.join(__dirname, "../", "data", "language.json"))),
        "categorys": JSON.parse(fs.readFileSync(path.join(__dirname, "../", "data", "categorys.json"))),
        "spendings": JSON.parse(fs.readFileSync(path.join(__dirname, "../", "data", "spendings.json"))),
        "repeat": JSON.parse(fs.readFileSync(path.join(__dirname, "../", "data", "repeat.json")))
    }
}

function autoSave() {
    saveCache()
    setTimeout(() => {
        autoSave()
    }, 1000 * 10);
}

function saveCache() {
    fs.writeFileSync(path.join(__dirname, "../", "data", "language.json"), JSON.stringify(cache.language, null, 4));
    fs.writeFileSync(path.join(__dirname, "../", "data", "categorys.json"), JSON.stringify(cache.categorys, null, 4));
    fs.writeFileSync(path.join(__dirname, "../", "data", "spendings.json"), JSON.stringify(cache.spendings, null, 4));
    fs.writeFileSync(path.join(__dirname, "../", "data", "repeat.json"), JSON.stringify(cache.repeat, null, 4));
}

function checkObject(...args) {
    let ob = cache.spendings;
    let ok = true;
    for (arg of args) {
        if (ob.hasOwnProperty(arg)) {
            ob = ob[arg]
        } else {
            ok = false;
            break;
        }
    }
    return ok;
}

function getAllSpendingsArray() {
    let ret = []
    let YearKeys = Object.keys(cache.spendings)
    for (let i = 0; i < YearKeys.length; i++) {
        let MonthKeys = Object.keys(cache.spendings[YearKeys[i]])
        for (let a = 0; a < MonthKeys.length; a++) {
            let DayKeys = Object.keys(cache.spendings[YearKeys[i]][MonthKeys[a]])
            for (let o = 0; o < DayKeys.length; o++) {
                ret.push(cache.spendings[YearKeys[i]][MonthKeys[a]][DayKeys[o]])
            }
        } 
    }
    return ret
}

exports.resolveCategory = resolveCategory
exports.readCache = readCache
exports.saveCache = saveCache
exports.getCategorys = getCategorys
exports.resolveLanguageCode = resolveLanguageCode
exports.addSpending = addSpending;
exports.getTotalSpending = getSpendingsFromDates(new Date(0), new Date())
exports.addCategory = addCategory
exports.removeCategory = removeCategory
exports.updateCategory = updateCategory
exports.getSpendingsFromDates = getSpendingsFromDates
exports.autoSaveCache = autoSave
exports.checkForUpdate = checkForUpdate