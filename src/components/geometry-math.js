
//Функции расчета всяких кругов, полигонов и т.п.

//Функция расчета вписанной в многоугольник окружности
function polygonIncircle(points) {
    var circle = {radius: 0};

    for (var i = 0, n = points.length; i < n; ++i) {
        var pi0 = points[i],
            pi1 = points[(i + 1) % n];
        for (var j = i + 1; j < n; ++j) {
            var pj0 = points[j],
                pj1 = points[(j + 1) % n],
                pij = j === i + 1 ? pj0 : lineLineIntersection(pi0[0], pi0[1], pi1[0], pi1[1], pj0[0], pj0[1], pj1[0], pj1[1]);
            search: for (var k = j + 1; k < n; ++k) {
                var pk0 = points[k],
                    pk1 = points[(k + 1) % n],
                    pik = lineLineIntersection(pi0[0], pi0[1], pi1[0], pi1[1], pk0[0], pk0[1], pk1[0], pk1[1]),
                    pjk = k === j + 1 ? pk0 : lineLineIntersection(pj0[0], pj0[1], pj1[0], pj1[1], pk0[0], pk0[1], pk1[0], pk1[1]),
                    candidate = triangleIncircle(pij[0], pij[1], pik[0], pik[1], pjk[0], pjk[1]),
                    radius = candidate.radius;

                for (var l = 0; l < n; ++l) {
                    var pl0 = points[l],
                        pl1 = points[(l + 1) % n],
                        r = pointLineDistance(candidate[0], candidate[1], pl0[0], pl0[1], pl1[0], pl1[1]);
                    if (r < circle.radius) continue search;
                    if (r < radius) radius = r;
                }
                if (!isNaN(candidate.radius)) {
                    circle = candidate;
                    circle.radius = radius;
                }
            }
        }
    }
    return circle;
}

//Функция расчета окружности, вписанной в треугольник
function triangleIncircle(x0, y0, x1, y1, x2, y2) {
    var x01 = x0 - x1, y01 = y0 - y1,
        x02 = x0 - x2, y02 = y0 - y2,
        x12 = x1 - x2, y12 = y1 - y2,
        l01 = Math.sqrt(x01 * x01 + y01 * y01),
        l02 = Math.sqrt(x02 * x02 + y02 * y02),
        l12 = Math.sqrt(x12 * x12 + y12 * y12),
        k0 = l01 / (l01 + l02),
        k1 = l12 / (l12 + l01),
        center = lineLineIntersection(x0, y0, x1 - k0 * x12, y1 - k0 * y12, x1, y1, x2 + k1 * x02, y2 + k1 * y02);
    center.radius = Math.sqrt((l02 + l12 - l01) * (l12 + l01 - l02) * (l01 + l02 - l12) / (l01 + l02 + l12)) / 2;
    return center;
}

//Функция расчета пересечения линий на плоскости
function lineLineIntersection(x0, y0, x1, y1, x2, y2, x3, y3) {
    var x02 = x0 - x2, y02 = y0 - y2,
        x10 = x1 - x0, y10 = y1 - y0,
        x32 = x3 - x2, y32 = y3 - y2,
        t = (x32 * y02 - y32 * x02) / (y32 * x10 - x32 * y10);
    return [x0 + t * x10, y0 + t * y10];
}

//Функция расчета расстояния между точками
function pointLineDistance(x0, y0, x1, y1, x2, y2) {
    var x21 = x2 - x1, y21 = y2 - y1;
    return (y21 * x0 - x21 * y0 + x2 * y1 - y2 * x1) / Math.sqrt(y21 * y21 + x21 * x21);
}