
//Функции рисования


//Нарисовать название скважины
function drawName(point, context, color) {
    context.font = "10px serif";
    context.fillStyle = color;
    context.fillText(point.name, point[0] + 7, point[1] + 4);
}

//Нарисовать точку скважины
function drawPoint(point, context) {
    context.moveTo(point[0] + 1.5, point[1]);
    context.arc(point[0], point[1], 1.5, 0, 2 * Math.PI);
}

function drawTriangle(point, context) {

    context.moveTo(point[0]-6, point[1]+2);
    context.lineTo(point[0], point[1]-6);
    context.lineTo(point[0]+6, point[1]+2);
    context.lineTo(point[0]-6, point[1]+2);
    context.lineTo(point[0], point[1]);

}

//Нарисовать область вороного
function drawPolygon(points, context) {
    context.moveTo(points[0][0], points[0][1]);
    for (var i = 1, n = points.length; i < n; ++i) context.lineTo(points[i][0], points[i][1]);
    context.closePath();
}

//нарисовать вписанную окружность
function drawPolygonIncircle(points, offsetRadius, context) {
    var circle = polygonIncircle(points),
        radius = circle.radius + offsetRadius;
    if (radius > 0) {
        context.moveTo(circle[0] + radius, circle[1]);
        context.arc(circle[0], circle[1], radius, 0, 2 * Math.PI);
    }
}