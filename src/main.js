var all_voronoy_centers = [];
var all_voronoy_areas = [];

document.getElementById('fileInput').addEventListener('change', handleFileUpload);

//Добывающие скважины
var canvas_prod_wells = document.getElementById("prod_wells");
var context_prod_wells = canvas_prod_wells.getContext("2d");
var prod_wells_count = 200;
var prod_well_names = new Array(prod_wells_count);
var prod_voronoy_centers = [];
var prod_voronoy_areas = [];
let prod_torf_polygons = [];

//Нагнетательные скважины
var canvas_inj_wells = document.getElementById("inj_wells");
var context_inj_wells = canvas_inj_wells.getContext("2d");
var inj_wells_count = 100;
var inj_well_names = new Array(inj_wells_count);
var inj_voronoy_centers = [];
var inj_voronoy_areas = [];
let inj_torf_polygons = [];

//Результирующая карта
var canvas_result_wells = document.getElementById("result_wells");
var context_result_wells = canvas_result_wells.getContext("2d");

//Общие параметры
var connect_coefficient = 5; //коэффициент тесноты связи
var width = canvas_prod_wells.width;
var height = canvas_prod_wells.height;
var voro = voronoi.voronoi().extent([[0.5, 0.5], [width - 0.5, height - 0.5]]);
var result_dataset = [];
var normalized_dataset = [];
let count = 0;

let dataList = [];

var button = document.getElementById("result_map");

function calculateFullMap(event) {
    context_result_wells.clearRect(0, 0, width, height);
    //нарисовать все.области
    const based_color = "rgb(13,126,0)"
    drawFullMap(context_result_wells, all_voronoy_areas, all_voronoy_centers, false, false, based_color)

    //нарисовать нагн.области
    drawFullMap(context_result_wells, inj_voronoy_areas, inj_voronoy_centers, false, true)
    //сделать канвас притемненным
    context_result_wells.fillStyle = "rgba(157,153,153,0.34)"
    context_result_wells.fillRect(0, 0, width, height);
}


button.onclick = function (event) {
    if (inj_torf_polygons === null || inj_torf_polygons.length === 0) {
        return;
    }
    //создать итоговый result_dataset
    inj_torf_polygons.forEach(function (inj_polygon) {
        findIntersection(inj_polygon);
    });

    //создать нормализованный датасет
    const max_min_X_Inj_Well = arrayMinMax(result_dataset.map(o => o.X_Inj_Well))
    const max_X_Inj_Well = max_min_X_Inj_Well[1];
    const min_X_Inj_Well = max_min_X_Inj_Well[0];
    const dif_X_Inj_Well = max_X_Inj_Well - min_X_Inj_Well;

    const max_min_X_Prod_Well = arrayMinMax(result_dataset.map(o => o.X_Prod_Well))
    const max_X_Prod_Well = max_min_X_Prod_Well[1];
    const min_X_Prod_Well = max_min_X_Prod_Well[0];
    const dif_X_Prod_Well = max_X_Prod_Well - min_X_Prod_Well;

    const max_min_Y_Inj_Well = arrayMinMax(result_dataset.map(o => o.Y_Inj_Well))
    const max_Y_Inj_Well = max_min_Y_Inj_Well[1];
    const min_Y_Inj_Well = max_min_Y_Inj_Well[0];
    const dif_Y_Inj_Well = max_Y_Inj_Well - min_Y_Inj_Well;

    const max_min_Y_Prod_Well = arrayMinMax(result_dataset.map(o => o.Y_Prod_Well))
    const max_Y_Prod_Well = max_min_Y_Prod_Well[1];
    const min_Y_Prod_Well = max_min_Y_Prod_Well[0];
    const dif_Y_Prod_Well = max_Y_Prod_Well - min_Y_Prod_Well;

    result_dataset.forEach(function (value, index) {
        let this_value = {
            "N_Inj_Well": value.N_Inj_Well,
            "X_Inj_Well": (value.X_Inj_Well - min_X_Inj_Well) / dif_X_Inj_Well,
            "Y_Inj_Well": (value.Y_Inj_Well - min_Y_Inj_Well) / dif_Y_Inj_Well,
            "N_Prod_Well": value.N_Prod_Well,
            "X_Prod_Well": (value.X_Prod_Well - min_X_Prod_Well) / dif_X_Prod_Well,
            "Y_Prod_Well": (value.Y_Prod_Well - min_Y_Prod_Well) / dif_Y_Prod_Well,
            "connect": value.connect
        }
        normalized_dataset[index] = this_value;
    });

    //создание excel файла
    let excel_file = XLSX.utils.book_new();
    excel_file.Props = {
        Title: "Wells Dataset",
        Subject: "Wells dataset",
        Author: "Yakimov",
        CreatedDate: new Date(2023, 5, 1)
    };
    //excel_file.SheetNames.push("wells_eng", "wells_norm", "wells_based");
    excel_file.SheetNames.push("wells_norm");
    // let wells_eng_data = [["N_Inj_Well", "X_Inj_Well", "Y_Inj_Well", "N_Prod_Well", "X_Prod_Well", "Y_Prod_Well", "connect"]];
    // result_dataset.forEach(function (value, index) {
    //     wells_eng_data[index+1]=[value.N_Inj_Well, value.X_Inj_Well, value.Y_Inj_Well, value.N_Prod_Well, value.X_Prod_Well, value.Y_Prod_Well, value.connect];
    // });
    // let wells_eng_data_sheet = XLSX.utils.aoa_to_sheet(wells_eng_data);
    // excel_file.Sheets["wells_eng"] = wells_eng_data_sheet;

    let wells_norm_data = [["N_Inj_Well", "X_Inj_Well", "Y_Inj_Well", "N_Prod_Well", "X_Prod_Well", "Y_Prod_Well", "connect"]];
    normalized_dataset.forEach(function (value, index) {
        wells_norm_data[index + 1] = [value.N_Inj_Well, value.X_Inj_Well, value.Y_Inj_Well, value.N_Prod_Well, value.X_Prod_Well, value.Y_Prod_Well, value.connect];
    });
    let wells_norm_data_sheet = XLSX.utils.aoa_to_sheet(wells_norm_data);
    excel_file.Sheets["wells_norm"] = wells_norm_data_sheet;

    // let wells_based_data = [["N_Inj_Well", "X_Inj_Well", "Y_Inj_Well", "N_Prod_Well", "X_Prod_Well", "Y_Prod_Well", "connect"]];
    // let someIndex = 1;
    // inj_torf_polygons.forEach(function (value, index) {
    //     const inj_well_name = value.point.name;
    //     const connectedWells = normalized_dataset.filter((value) => value.connect===true && value.N_Inj_Well === inj_well_name);
    //     connectedWells.forEach(function (value, index){
    //         wells_based_data[someIndex]=[value.N_Inj_Well, value.X_Inj_Well, value.Y_Inj_Well, value.N_Prod_Well, value.X_Prod_Well, value.Y_Prod_Well, value.connect];
    //         someIndex++;
    //     })
    //     const connectedWellsCount = connectedWells.length;
    //     const shuffledDisconnectedWells = normalized_dataset.filter((value) => value.connect===false && value.N_Inj_Well === inj_well_name).sort(() => 0.5 - Math.random());
    //     let disconnectedWells = shuffledDisconnectedWells.slice(0, connectedWellsCount);
    //     disconnectedWells.forEach(function (value, index){
    //         wells_based_data[someIndex]=[value.N_Inj_Well, value.X_Inj_Well, value.Y_Inj_Well, value.N_Prod_Well, value.X_Prod_Well, value.Y_Prod_Well, value.connect];
    //         someIndex++;
    //     })
    // });
    // let wells_based_data_sheet = XLSX.utils.aoa_to_sheet(wells_based_data);
    // excel_file.Sheets["wells_based"] = wells_based_data_sheet;

    let excel_file_bytes = XLSX.write(excel_file, {bookType: "xlsx", type: "binary"});
    saveAs(new Blob([s2ab(excel_file_bytes)], {type: "application/octet-stream"}), 'well_dataset.xlsx');

//     // Создаем Blob из бинарных данных Excel файла
//     var blob = new Blob([s2ab(excel_file_bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
// // Создание объекта FormData и добавление Blob в него
//     var formData = new FormData();
//     formData.append('file', blob, 'wells_dataset.xlsx');
// // Отправка запроса на сервер
//     fetch('http://127.0.0.1:5000/upload', {
//         method: 'POST',
//         body: formData
//     })
//         .then(response => {
//             if (response.ok) {
//                 return response.text();
//             }
//             throw new Error('Network response was not ok.');
//         })
//         .then(result => {
//             console.log(result); // Выводим результат загрузки файла на сервер
//         })
//         .catch(error => {
//             console.error('There has been a problem with your fetch operation:', error);
//         });
    //   saveAs(new Blob([s2ab(excel_file_bytes)], {type:"application/octet-stream"}), 'well_dataset.xlsx');
}

function excelDataToBlob(excelData) {
    const arrayBuffer = new Uint8Array(excelData).buffer;
    return new Blob([arrayBuffer], {type: 'application/octet-stream'});
}


// Функция для обработки загрузки файла
function handleFileUpload(event) {
    all_voronoy_centers = [];
    all_voronoy_areas = [];
    //Добывающие скважины
    prod_voronoy_centers = [];
    prod_voronoy_areas = [];
    prod_torf_polygons = [];
//Нагнетательные скважины
    inj_voronoy_centers = [];
    inj_voronoy_areas = [];
    inj_torf_polygons = [];
    result_dataset = [];
    normalized_dataset = [];
    count = 0;
    dataList = [];

    const file = event.target.files[0];
    // Проверяем, что файл с расширением xlsx
    if (file && file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            // Получаем первый лист из файла
            // const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets['user_data'];
            // Парсим данные из листа в формате JSON
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            // Создаем список данных
            jsonData.forEach(row => {
                const item = {
                    "номер нагнетательной скважины": row['N_Inj_Well'],
                    "Условная координата Х наг.скв.": row["X_Inj_Well"],
                    "Условная координата У наг.скв.": row["Y_Inj_Well"],
                    "Номер добывающей скважины": row["N_Prod_Well"],
                    "Условная координата Х доб.скв.": row["X_Prod_Well"],
                    "Условная координата У доб.скв.": row["Y_Prod_Well"],
                    "Наличие взаимодействия": row["connect"]
                };
                dataList.push(item);
            });
            // Используем полученные данные
            //Создать карту областей всех скважин
            drawStuff()
            button.style.backgroundColor = '#007bff';
            button.removeAttribute('disabled');
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert("Пожалуйста, выберите файл в формате XLSX.");
    }
}

var scaleFactorProd = 1.0;
var scaleFactorInj = 1.0;
var scaleFactorResult = 1.0;
$('.zoomInProd').click(function () {
    scaleFactorProd += 0.1;
    applyScale(context_prod_wells, scaleFactorProd);
});

$('.zoomOutProd').click(function () {
    if (scaleFactorProd > 1.0) {
        scaleFactorProd -= 0.1;
        applyScale(context_prod_wells, scaleFactorProd);
    }
});

$('.zoomInInj').click(function () {
    scaleFactorInj += 0.1;
    applyScale(context_inj_wells, scaleFactorInj);
});

$('.zoomOutInj').click(function () {
    if (scaleFactorInj > 1.0) {
        scaleFactorInj -= 0.1;
        applyScale(context_inj_wells, scaleFactorInj);
    }
});

$('.zoomInResult').click(function () {
    scaleFactorResult += 0.1;
    applyScale(context_result_wells, scaleFactorResult);
});

$('.zoomOutResult').click(function () {
    if (scaleFactorResult > 1.0) {
        scaleFactorResult -= 0.1;
        applyScale(context_result_wells, scaleFactorResult);
    }
});

function applyScale(originalCtx, scaleFactor) {
    originalCtx.restore();
    originalCtx.save();
    originalCtx.scale(scaleFactor, scaleFactor);
    drawStuff(originalCtx);
}

var dragging = false;
var lastX;
var lastY;

$('#prod_wells, #inj_wells, #result_wells').mousedown(function (e) {
    dragging = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});

$('#prod_wells, #inj_wells, #result_wells').mousemove(function (e) {
    let scaleFactor;
    switch ($(this)[0]) {
        case canvas_inj_wells:
            scaleFactor = scaleFactorInj;
            break;
        case canvas_prod_wells:
            scaleFactor = scaleFactorProd;
            break;
        case canvas_result_wells:
            scaleFactor = scaleFactorResult;
            break;
        default:
            scaleFactor = 1; // По умолчанию масштаб равен 1
    }

    if (dragging && scaleFactor > 1) {
        var deltaX = e.offsetX - lastX;
        var deltaY = e.offsetY - lastY;
        lastX = e.offsetX;
        lastY = e.offsetY;
        var canvas = $(this)[0];
        var ctx = canvas.getContext('2d');

        // Получаем размеры канваса
        var canvasWidth = canvas.width;
        var canvasHeight = canvas.height;

        // Определяем текущие координаты изображения
        var currentTransform = ctx.getTransform();
        var currentX = currentTransform.e;
        var currentY = currentTransform.f;

        // Проверяем, чтобы новые координаты не выходили за границы канваса
        var minX = canvasWidth - (canvasWidth * scaleFactor);
        var minY = canvasHeight - (canvasHeight * scaleFactor);
        var maxX = 0;
        var maxY = 0;

        // Новые координаты после перемещения
        var newPosX = Math.min(Math.max(currentX + deltaX, minX), maxX);
        var newPosY = Math.min(Math.max(currentY + deltaY, minY), maxY);

        // Применяем перемещение
        ctx.setTransform(scaleFactor, 0, 0, scaleFactor, newPosX, newPosY);
        drawStuff(ctx);
    }
});

$(document).mouseup(function () {
    dragging = false;
});

function drawStuff(ctx) {
    if (ctx !== null) {
        if (ctx === context_prod_wells) {
            calculateProdMap();
            return;
        }
        if (ctx === context_inj_wells) {
            calculateInjMap();
            return;
        }
        if (ctx === context_result_wells) {
            calculateFullMap();
            return;
        }
    }
    calculateProdMap()
    calculateInjMap()
    calculateFullMap();
}

function calculateProdMap() {
    inj_voronoy_centers = createVoronoyAreaCentersInj(dataList);
    prod_voronoy_centers = createVoronoyAreaCentersProd(dataList);
    all_voronoy_centers = [...prod_voronoy_centers, ...inj_voronoy_centers];
    all_voronoy_areas = voro(all_voronoy_centers);
    all_voronoy_areas.forEach(function (area) {
        area.forEach(function (coordinates) {
            coordinates[0] = Math.trunc(coordinates[0])
            coordinates[1] = Math.trunc(coordinates[1])
        })
    })
    drawFullMap(context_prod_wells, all_voronoy_areas, all_voronoy_centers, true, false)

    //заполнить список торф-многоугольников ДС
    all_voronoy_areas.forEach(function (area, index) {
        if (area.point.name.includes("D")) {
            createTorfPolygons(area, prod_torf_polygons);
        }
    });
}

function calculateInjMap() {
    inj_voronoy_areas = voro(inj_voronoy_centers);
    inj_voronoy_areas.forEach(function (area) {
        area.forEach(function (coordinates) {
            coordinates[0] = Math.trunc(coordinates[0])
            coordinates[1] = Math.trunc(coordinates[1])
        })
    })

    drawFullMap(context_inj_wells, inj_voronoy_areas, inj_voronoy_centers, true, true)

    //заполнить список торф-многоугольников НС
    inj_voronoy_areas.forEach(function (area) {
        createTorfPolygons(area, inj_torf_polygons);
    });
}

const arrayMinMax = (arr) =>
    arr.reduce(([min, max], val) => [Math.min(min, val), Math.max(max, val)], [
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
    ]);

//конвертер для перевода данных в эксель файл
function s2ab(s) {
    let buf = new ArrayBuffer(s.length);
    let view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
}

//Создать итоговый датасет с пересечениями областей
function findIntersection(inj_polygon) {
    for (let i = 0; i < prod_torf_polygons.length; i++) {
        let intersection = turf.intersect(inj_polygon, prod_torf_polygons[i]);
        let fully_contain = turf.booleanWithin(prod_torf_polygons[i], inj_polygon)
        if (intersection) {
            if (!fully_contain) {
                let prod_polygon_area = calculateArea(prod_torf_polygons[i].geometry.coordinates[0]);
                let crossed_area = calculateArea(intersection.geometry.coordinates[0]);
                if (isProperIntersection(prod_polygon_area, crossed_area)) {
                    result_dataset[count] = createDatasetRow(prod_torf_polygons[i].point, inj_polygon.point, true);
                } else {
                    result_dataset[count] = createDatasetRow(prod_torf_polygons[i].point, inj_polygon.point, false);
                }
            } else {
                result_dataset[count] = createDatasetRow(prod_torf_polygons[i].point, inj_polygon.point, true);
            }
        } else {
            if (fully_contain) {
                result_dataset[count] = createDatasetRow(prod_torf_polygons[i].point, inj_polygon.point, true);
            } else {
                result_dataset[count] = createDatasetRow(prod_torf_polygons[i].point, inj_polygon.point, false);
            }
        }
        count++;
    }
}

//функция создания строчки датасета
function createDatasetRow(prod_point, inj_point, connect) {
    return {
        "N_Inj_Well": inj_point.name,
        "X_Inj_Well": inj_point[0],
        "Y_Inj_Well": inj_point[1],
        "N_Prod_Well": prod_point.name,
        "X_Prod_Well": prod_point[0],
        "Y_Prod_Well": prod_point[1],
        "connect": connect
    };
}

//Является ли пересечение полноценным с учетом КТС.
function isProperIntersection(polygon_area, crossed_area) {
    let minimum_area = (polygon_area / 100) * connect_coefficient
    return crossed_area >= minimum_area;
}

/* Get area of a polygon/surface */
function calculateArea(polygon) {
    let total = 0;
    for (let i = 0; i < polygon.length; i++) {
        const addX = polygon[i][0];
        const addY = polygon[i === polygon.length - 1 ? 0 : i + 1][1];
        const subX = polygon[i === polygon.length - 1 ? 0 : i + 1][0];
        const subY = polygon[i][1];
        total += (addX * addY * 0.5) - (subX * subY * 0.5);
    }
    return Math.abs(total);
}

//функция заполнения массива торф-полигонов
function createTorfPolygons(area, polygons) {
    let coordinates = [[]];
    for (let i = 0, n = area.length; i < n; ++i) {
        coordinates[0][i] = [area[i][0], area[i][1]];
    }
    let polygon = {
        "type": "Feature",
        "properties": {
            "fill": "#00f"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": coordinates
        },
        "point": area.point
    }
    polygons[polygons.length] = polygon
}

//Создание карт областей добывающих или нагнетательных скважин
function drawFullMap(context, areas, voronoy_centers, need_circle, needTriangle, based_color) {
    //нарисовать вписанные окружности
    if (need_circle) {
        context.clearRect(0, 0, width, height);
        context.beginPath();
        areas.forEach(function (cell) {
            context.beginPath();
            drawPolygonIncircle(cell, -2.5, context);
            if (cell.point.name.includes("D")) {
                context.fillStyle = "rgba(142,207,248,0.48)";
            } else {
                context.fillStyle = "rgba(248,142,142,0.48)";
            }
            context.fill();
            context.closePath();
        });
    }

    //нарисовать области вороного
    areas.forEach(function (cell) {
        context.beginPath();
        drawPolygon(cell, context);
        context.lineWidth = 1;
        if (based_color) {
            context.strokeStyle = based_color;
        } else {
            if (cell.point.name.includes("D")) {
                context.strokeStyle = "rgb(0,12,245)";
            } else {
                context.strokeStyle = "rgb(245,0,0)";
            }
        }
        context.stroke();
        context.closePath();
    });

    //нарисовать точки или треугольники
    voronoy_centers.forEach(function (particle) {
        if (particle.name.includes("D")) {
            context.beginPath();
            drawPoint(particle, context);
            context.fillStyle = "rgb(0,12,245)";
            context.fill();
            context.beginPath();
        } else {
            context.beginPath();
            drawTriangle(particle, context);
            context.fillStyle = "rgb(245,0,0)";
            context.fill();
            context.closePath();
        }
    });

    //нарисовать имена
    voronoy_centers.forEach(function (particle) {
        context.beginPath();
        if (particle.name.includes("D")) {
            drawName(particle, context, "rgb(0,12,245)");
        } else {
            drawName(particle, context, "rgb(245,0,0)");
        }
        context.closePath();
    });
}

//функция создания частиц - центров областей вороного
function createVoronoyAreaCentersInj(areas) {
    // Функция для создания уникального ключа для объекта
    function getKey(obj) {
        return obj["номер нагнетательной скважины"] + "_" + obj["Условная координата Х наг.скв."] + "_" + obj["Условная координата У наг.скв."];
    }

    // Создаем объект Set для хранения уникальных ключей
    const uniqueKeys = new Set();

    // Создаем список уникальных объектов
    const uniqueItems = areas.filter(item => {
        const key = getKey(item);
        // Если ключ уникален, добавляем его в Set и возвращаем true, чтобы сохранить объект в списке уникальных
        if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            return true;
        }
        return false;
    });
    let particles = [];
    for (let i = 0; i < uniqueItems.length; ++i) {
        particles[i] =
            {
                name: uniqueItems[i]["номер нагнетательной скважины"] + " I",
                0: Math.trunc(uniqueItems[i]["Условная координата Х наг.скв."] * width),
                1: Math.trunc(uniqueItems[i]["Условная координата У наг.скв."] * height),
                vx: 0,
                vy: 0
            };
    }
    particles = particles.filter(item => {
        if (isNaN(item[0]) || isNaN(item[1])) {
            return false;
        }
        return true;
    });
    return particles;
}

//функция создания частиц - центров областей вороного
function createVoronoyAreaCentersProd(areas) {
    // Функция для создания уникального ключа для объекта
    function getKey(obj) {
        return obj["Номер добывающей скважины"] + "_" + obj["Условная координата Х доб.скв."] + "_" + obj["Условная координата У доб.скв."];
    }

    // Создаем объект Set для хранения уникальных ключей
    const uniqueKeys = new Set();

    // Создаем список уникальных объектов
    const uniqueItems = areas.filter(item => {

        const key = getKey(item);
        // Если ключ уникален, добавляем его в Set и возвращаем true, чтобы сохранить объект в списке уникальных
        if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            return true;
        }
        return false;
    });
    let particles = [];
    for (let i = 0; i < uniqueItems.length; ++i) {
        particles[i] =
            {
                name: uniqueItems[i]["Номер добывающей скважины"] + " D",
                0: Math.trunc(uniqueItems[i]["Условная координата Х доб.скв."] * width),
                1: Math.trunc(uniqueItems[i]["Условная координата У доб.скв."] * height),
                vx: 0,
                vy: 0
            };
    }
    particles = particles.filter(item => {
        if (isNaN(item[0]) || isNaN(item[1])) {
            return false;
        }
        return true;
    });
    return particles;
}