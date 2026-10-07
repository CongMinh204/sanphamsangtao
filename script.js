const container =
    document.getElementById("lessonContainer");

const modal =
    document.getElementById("modal");

const modalTitle =
    document.getElementById("modalTitle");

const modalBody =
    document.getElementById("modalBody");

let lessons = [];

let completed =
    JSON.parse(
        localStorage.getItem("completed_csht")
    ) || [];

const pad = n => String(n).padStart(2, "0");

document.getElementById("todayDate").innerText =
    new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

fetch("lessons.json")
    .then(res => res.json())
    .then(data => {

        lessons = data;

        document.getElementById("lessonCount").innerText =
            data.length;

        renderLessons(data);

        updateProgress();

    });

function renderLessons(data) {

    container.innerHTML = "";

    if (data.length === 0) {

        container.innerHTML =
            `<p class="empty-state">Không tìm thấy bài học phù hợp.</p>`;

        return;
    }

    data.forEach(item => {

        const card =
            document.createElement("article");

        card.className = "card";

        card.innerHTML = `
            <span class="card-no">${pad(item.id)}</span>
            <h3 class="card-title">${item.title}</h3>
            <p class="card-summary">${item.summary}</p>

            <div class="card-actions">
                <button
                class="detail-btn"
                onclick="showDetail(${item.id})">
                Đọc bài
                </button>

                <button
                class="summary-btn"
                onclick="showSummary(${item.id})">
                Tóm tắt
                </button>
            </div>
        `;

        container.appendChild(card);
    });

}

async function showDetail(id) {

    const lesson =
        lessons.find(x => x.id === id);

    if (!lesson) return;

    modalTitle.innerText =
        lesson.title;

    try {

        const response =
            await fetch(lesson.file);

        const content =
            await response.text();

        modalBody.innerHTML =
            marked.parse(content);

        modalBody.querySelectorAll("img").forEach(img => {

            const link =
                document.createElement("a");

            link.href = img.getAttribute("src");
            link.target = "_blank";
            link.rel = "noopener";
            link.title = "Mở ảnh cỡ gốc";

            img.loading = "lazy";
            img.replaceWith(link);
            link.appendChild(img);

        });

    } catch (error) {

        modalBody.innerHTML =
            "<p>Không thể tải nội dung bài học.</p>";

    }

    openModal();

    markCompleted(id);

}

function showSummary(id) {

    const lesson =
        lessons.find(x => x.id === id);

    if (!lesson) return;

    modalTitle.innerText =
        lesson.title;

    modalBody.innerHTML =
        `<p>${lesson.summary}</p>`;

    openModal();

}

function openModal() {

    modal.style.display = "block";

    modal.querySelector(".modal-content").scrollTop = 0;

}

function closeModal() {

    modal.style.display = "none";

}

document
    .getElementById("closeModal")
    .onclick = closeModal;

window.onclick = (event) => {

    if (event.target === modal) {

        closeModal();

    }

};

document.addEventListener("keydown", e => {

    if (e.key === "Escape") {

        closeModal();

    }

});

document
    .getElementById("searchInput")
    .addEventListener("input", e => {

        const keyword =
            e.target.value.toLowerCase();

        const filtered =
            lessons.filter(item =>

                item.title
                    .toLowerCase()
                    .includes(keyword)

                ||

                item.summary
                    .toLowerCase()
                    .includes(keyword)

            );

        renderLessons(filtered);

    });

function markCompleted(id) {

    if (!completed.includes(id)) {

        completed.push(id);

        localStorage.setItem(
            "completed_csht",
            JSON.stringify(completed)
        );

        updateProgress();

    }

}

function updateProgress() {

    if (lessons.length === 0) return;

    const percent =
        (completed.length /
            lessons.length) * 100;

    document.getElementById(
        "progressBar"
    ).style.width =
        percent + "%";

    document.getElementById(
        "progressText"
    ).innerText =
        `Đã học: ${Math.round(percent)}%`;

}

const quizContainer =
    document.getElementById("quizContainer");

if (quizContainer) {

    document.getElementById("quizCount").innerText =
        quizData.length;

    quizData.forEach((q, index) => {

        const div =
            document.createElement("div");

        div.className = "question";

        div.innerHTML = `
            <h3>
                <span class="q-no">Câu ${pad(index + 1)}</span>
                ${q.question}
            </h3>

            ${q.options.map((opt, i) => `
                <label class="option">
                    <input
                        type="radio"
                        name="q${index}"
                        value="${i}">
                    <span class="option-key">${"ABCD"[i]}</span>
                    <span>${opt}</span>
                </label>
            `).join("")}
        `;

        quizContainer.appendChild(div);

    });

    document
        .getElementById("submitQuiz")
        .onclick = () => {

            let score = 0;

            quizData.forEach((q, index) => {

                const selected =
                    document.querySelector(
                        `input[name="q${index}"]:checked`
                    );

                const questionDiv =
                    document.querySelectorAll(
                        ".question"
                    )[index];

                let resultBox =
                    questionDiv.querySelector(
                        ".result"
                    );

                if (!resultBox) {

                    resultBox =
                        document.createElement("div");

                    resultBox.className =
                        "result";

                    questionDiv.appendChild(
                        resultBox
                    );
                }

                if (!selected) {

                    resultBox.innerHTML =
                        `<span class="wrong">Chưa chọn đáp án</span>`;

                    return;
                }

                const userAnswer =
                    Number(selected.value);

                document
                    .querySelectorAll(
                        `input[name="q${index}"]`
                    )
                    .forEach(input => {

                        input.disabled = true;

                    });

                if (userAnswer === q.answer) {

                    score++;

                    resultBox.innerHTML =
                        `<span class="correct">✓ Chính xác</span>`;

                } else {

                    resultBox.innerHTML = `
                        <span class="wrong">✕ Sai</span>
                        <span class="answer">
                            Đáp án đúng: ${"ABCD"[q.answer]}. ${q.options[q.answer]}
                        </span>
                    `;
                }

            });

            document
                .getElementById("quizResult")
                .innerHTML = `
                <h2>Kết quả: ${score}/${quizData.length}</h2>
            `;

            localStorage.setItem(
                "lastScore",
                score
            );

        };

    document
        .getElementById("resetQuiz")
        .onclick = () => {

            document
                .querySelectorAll('input[type="radio"]')
                .forEach(input => {

                    input.checked = false;
                    input.disabled = false;

                });

            document
                .querySelectorAll(".result")
                .forEach(result => {

                    result.remove();

                });

            document.getElementById(
                "quizResult"
            ).innerHTML = "";

        };
}

const darkModeBtn =
    document.getElementById("darkModeBtn");

function applyTheme(isDark) {

    document.body.classList.toggle("dark", isDark);

    darkModeBtn.innerText =
        isDark ? "Giao diện sáng" : "Giao diện tối";

}

applyTheme(localStorage.getItem("theme") === "dark");

darkModeBtn.addEventListener("click", () => {

    const isDark =
        !document.body.classList.contains("dark");

    applyTheme(isDark);

    localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
    );

});
