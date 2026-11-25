
const display = document.getElementById("display");
const history = document.getElementById("history");

let expression = "";

// Hiển thị màn hình
function updateDisplay() {
    display.innerText = expression || "0";
}

// Thêm ký tự
function addValue(value) {
    expression += value;
    updateDisplay();
}

// Xóa một ký tự
function deleteOne() {
    expression = expression.slice(0, -1);
    updateDisplay();
}

// Xóa toàn bộ
function clearAll() {
    expression = "";
    history.innerText = "";
    updateDisplay();
}

// Tính kết quả
function calculate() {
    if (expression === "") return;

    try {
        let result = expression
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/−/g, "-");

        // Chỉ cho phép số và phép toán
        if (!/^[0-9+\-*/. ]+$/.test(result)) {
            throw new Error("Biểu thức không hợp lệ");
        }

        // Kiểm tra chia cho 0
        if (/\/0+(?:\.0+)?(?![0-9.])/.test(result)) {
            throw new Error("Không thể chia cho 0");
        }

        let answer = Function(
            '"use strict"; return (' + result + ')'
        )();

        if (!Number.isFinite(answer)) {
            throw new Error("Kết quả không hợp lệ");
        }

        history.innerText = expression + " =";

        expression = String(
            Number(answer.toPrecision(12))
        );

        updateDisplay();

    } catch (error) {
        display.innerText = "Error";
        history.innerText = "Phép tính không hợp lệ";
        expression = "";
    }
}

// Sử dụng bàn phím máy tính
document.addEventListener("keydown", function(event) {

    let key = event.key;

    if (/^[0-9.]$/.test(key)) {
        addValue(key);
    }

    else if (["+", "-", "*", "/"].includes(key)) {
        let symbol = key === "*" ? "×" :
                     key === "/" ? "÷" :
                     key === "-" ? "−" : "+";

        addValue(symbol);
    }

    else if (key === "Enter" || key === "=") {
        calculate();
    }

    else if (key === "Backspace") {
        deleteOne();
    }

    else if (key === "Escape") {
        clearAll();
    }

});
