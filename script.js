
const display = document.getElementById("display");
const history = document.getElementById("history");
const buttons = document.querySelectorAll("button");

let expression = "";
let answer = 0;
let angleMode = "DEG";

// ==============================
// 1. HIỂN THỊ MÀN HÌNH
// ==============================

function updateDisplay() {
    display.innerText = expression || "0";
}

function addValue(value) {
    expression += value;
    updateDisplay();
}

// ==============================
// 2. CHUYỂN ĐỔI GÓC
// ==============================

function toRadian(value) {
    return angleMode === "DEG"
        ? value * Math.PI / 180
        : value;
}

function fromRadian(value) {
    return angleMode === "DEG"
        ? value * 180 / Math.PI
        : value;
}

// ==============================
// 3. CÁC HÀM TOÁN HỌC
// ==============================

function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) {
        throw new Error("Giai thừa không hợp lệ");
    }

    if (n > 170) {
        throw new Error("Số quá lớn");
    }

    let result = 1;

    for (let i = 2; i <= n; i++) {
        result *= i;
    }

    return result;
}

const mathFunctions = {
    sin: x => Math.sin(toRadian(x)),
    cos: x => Math.cos(toRadian(x)),
    tan: x => {
        let r = toRadian(x);

        if (Math.abs(Math.cos(r)) < 1e-12) {
            throw new Error("Tan không xác định");
        }

        return Math.tan(r);
    },

    asin: x => fromRadian(Math.asin(x)),
    acos: x => fromRadian(Math.acos(x)),
    atan: x => fromRadian(Math.atan(x)),

    sqrt: x => Math.sqrt(x),
    cbrt: x => Math.cbrt(x),

    log: x => Math.log10(x),
    ln: x => Math.log(x),

    abs: x => Math.abs(x),
    exp: x => Math.exp(x),

    floor: x => Math.floor(x),
    ceil: x => Math.ceil(x),

    sinh: x => Math.sinh(x),
    cosh: x => Math.cosh(x),
    tanh: x => Math.tanh(x)
};

// ==============================
// 4. PHÂN TÍCH BIỂU THỨC
// ==============================

function tokenize(input) {

    input = input
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/π/g, "pi")
        .replace(/√/g, "sqrt");

    const tokens = [];
    const regex =
        /\s*(?:(\d+(?:\.\d*)?|\.\d+)(?:([eE][+-]?\d+))?|([a-zA-Z]+)|(.))/gy;

    let position = 0;

    while (position < input.length) {

        regex.lastIndex = position;
        const match = regex.exec(input);

        if (!match) {
            throw new Error("Lỗi biểu thức");
        }

        position = regex.lastIndex;

        if (match[1] !== undefined) {
            let number = match[1] + (match[2] || "");
            let value = Number(number);

            if (!Number.isFinite(value)) {
                throw new Error("Số không hợp lệ");
            }

            tokens.push({
                type: "number",
                value: value
            });
        }

        else if (match[3] !== undefined) {
            tokens.push({
                type: "name",
                value: match[3].toLowerCase()
            });
        }

        else if (match[4] !== undefined) {
            const symbol = match[4];

            if ("+-*/^!%()".includes(symbol)) {
                tokens.push({
                    type: symbol,
                    value: symbol
                });
            } else {
                throw new Error("Ký tự không hợp lệ");
            }
        }
    }

    return tokens;
}

// ==============================
// 5. BỘ PHÂN TÍCH VÀ TÍNH TOÁN
// ==============================

function evaluate(input) {

    const tokens = tokenize(input);
    let position = 0;

    function peek() {
        return tokens[position];
    }

    function consume(type) {
        if (!peek() || peek().type !== type) {
            throw new Error("Sai cú pháp");
        }

        return tokens[position++];
    }

    // Biểu thức cộng trừ
    function parseExpression() {

        let value = parseTerm();

        while (peek() &&
            (peek().type === "+" || peek().type === "-")) {

            let operator = tokens[position++].type;
            let next = parseTerm();

            if (operator === "+") {
                value += next;
            } else {
                value -= next;
            }
        }

        return value;
    }

    // Biểu thức nhân chia
    function parseTerm() {

        let value = parseUnary();

        while (peek()) {

            if (peek().type === "*") {
                position++;
                value *= parseUnary();
            }

            else if (peek().type === "/") {
                position++;

                let next = parseUnary();

                if (next === 0) {
                    throw new Error("Không thể chia cho 0");
                }

                value /= next;
            }

            // Nhân ngầm: 2(3), 2π, 2sin(30)
            else if (
                peek().type === "number" ||
                peek().type === "name" ||
                peek().type === "("
            ) {
                value *= parseUnary();
            }

            else {
                break;
            }
        }

        return value;
    }

    // Xử lý số âm và số dương
    function parseUnary() {

        if (peek() && peek().type === "+") {
            position++;
            return parseUnary();
        }

        if (peek() && peek().type === "-") {
            position++;
            return -parseUnary();
        }

        return parsePower();
    }

    // Lũy thừa
    function parsePower() {

        let value = parsePrimary();

        if (peek() && peek().type === "^") {
            position++;
            value = Math.pow(value, parseUnary());
        }

        return value;
    }

    // Số, hằng số, hàm toán học, ngoặc
    function parsePrimary() {

        let value;
        const token = peek();

        if (!token) {
            throw new Error("Thiếu dữ liệu");
        }

        // Số
        if (token.type === "number") {
            position++;
            value = token.value;
        }

        // Ngoặc
        else if (token.type === "(") {
            position++;

            value = parseExpression();

            consume(")");
        }

        // Tên hàm và hằng số
        else if (token.type === "name") {

            position++;

            const name = token.value;

            // Hằng số
            if (name === "pi") {
                value = Math.PI;
            }

            else if (name === "e") {
                value = Math.E;
            }

            else if (name === "ans") {
                value = answer;
            }

            // Hàm toán học
            else if (mathFunctions[name]) {

                consume("(");

                let argument = parseExpression();

                consume(")");

                value = mathFunctions[name](argument);
            }

            else {
                throw new Error("Hàm không tồn tại");
            }
        }

        else {
            throw new Error("Sai cú pháp");
        }

        // Giai thừa và phần trăm
        while (peek()) {

            if (peek().type === "!") {
                position++;
                value = factorial(value);
            }

            else if (peek().type === "%") {
                position++;
                value /= 100;
            }

            else {
                break;
            }
        }

        return value;
    }

    const result = parseExpression();

    if (position !== tokens.length) {
        throw new Error("Biểu thức không hợp lệ");
    }

    if (!Number.isFinite(result)) {
        throw new Error("Kết quả không xác định");
    }

    return Number(result.toPrecision(12));
}

// ==============================
// 6. TÍNH KẾT QUẢ
// ==============================

function calculate() {

    if (!expression) return;

    try {

        let result = evaluate(expression);

        history.innerText = expression + " =";

        answer = result;
        expression = String(result);

        updateDisplay();

    } catch (error) {

        display.innerText = "Error";
        history.innerText = error.message;

        expression = "";
    }
}

// ==============================
// 7. XỬ LÝ NÚT BẤM
// ==============================

function handleButton(value) {

    // Xóa toàn bộ
    if (value === "AC" || value === "ON") {

        expression = "";
        history.innerText = "";
        updateDisplay();

        return;
    }

    // Xóa một ký tự
    if (value === "DEL") {

        expression = expression.slice(0, -1);
        updateDisplay();

        return;
    }

    // Tính kết quả
    if (value === "=") {
        calculate();
        return;
    }

    // Chuyển DEG và RAD
    if (value === "MODE") {

        angleMode = angleMode === "DEG" ? "RAD" : "DEG";

        history.innerText = "Chế độ góc: " + angleMode;

        return;
    }

    // Bình phương
    if (value === "x²") {
        addValue("^2");
        return;
    }

    // Căn bậc hai
    if (value === "√") {
        addValue("sqrt(");
        return;
    }

    // Hàm lượng giác và logarit
    if ([
        "sin", "cos", "tan",
        "log", "ln"
    ].includes(value)) {

        addValue(value + "(");
        return;
    }

    // Hằng số pi
    if (value === "π") {
        addValue("π");
        return;
    }

    // Kết quả trước
    if (value === "Ans") {
        addValue("Ans");
        return;
    }

    // Dạng khoa học: 2 EXP 3 = 2E3
    if (value === "EXP") {
        addValue("E");
        return;
    }

    // Các nút chưa có chức năng riêng
    if (value === "SHIFT" || value === "ALPHA") {
        return;
    }

    // Các ký tự khác
    addValue(value);
}

// ==============================
// 8. GẮN SỰ KIỆN CHO NÚT
// ==============================

buttons.forEach(button => {

    button.addEventListener("click", function () {

        handleButton(button.innerText.trim());

    });

});

// ==============================
// 9. SỬ DỤNG BÀN PHÍM
// ==============================

document.addEventListener("keydown", function(event) {

    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        addValue(key);
    }

    else if (["+", "-", "*", "/", "^", "(", ")"].includes(key)) {
        addValue(key);
    }

    else if (key === "Enter" || key === "=") {
        calculate();
    }

    else if (key === "Backspace") {
        expression = expression.slice(0, -1);
        updateDisplay();
    }

    else if (key === "Escape") {
        expression = "";
        history.innerText = "";
        updateDisplay();
    }

    else if (key === "!") {
        addValue("!");
    }

    else if (key === "%") {
        addValue("%");
    }

});
