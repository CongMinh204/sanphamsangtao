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
                ${item.type === "flashcard" ? "Học thẻ" : "Đọc bài"}
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

    deck = null;

    modalTitle.innerText =
        lesson.title;

    try {

        const response =
            await fetch(lesson.file);

        const content =
            await response.text();

        if (lesson.type === "flashcard") {

            renderDeck(content);

        } else {

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

        }

    } catch (error) {

        modalBody.innerHTML =
            "<p>Không thể tải nội dung bài học.</p>";

    }

    openModal();

    // Move focus into the modal so Space flips the card instead of re-pressing the button behind it.
    if (deck) {

        document
            .getElementById("flashcard")
            .focus({ preventScroll: true });

    }

    markCompleted(id);

}

let deck = null;

function parseFlashcards(markdown) {

    const rows = markdown
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.startsWith("|"))
        .map(line =>
            line
                .replace(/^\||\|$/g, "")
                .split("|")
                .map(cell => marked.parseInline(cell.trim()))
        );

    const [labels, , ...cards] = rows;

    return {
        labels,
        cards: cards.map(([front, back]) => ({ front, back }))
    };

}

function renderDeck(markdown) {

    const { labels, cards } =
        parseFlashcards(markdown);

    deck = {
        cards,
        order: cards,
        index: 0
    };

    modalBody.innerHTML = `
        <div class="deck">

            <div class="deck-bar">
                <span class="label deck-help">Bấm vào thẻ để lật · Space: lật · ← →: chuyển thẻ</span>
                <button type="button" class="pill" id="deckShuffle" aria-pressed="false">Trộn thẻ</button>
            </div>

            <div class="progress-wrapper">
                <div class="deck-progress" id="deckProgress"></div>
            </div>

            <button type="button" class="flashcard" id="flashcard">
                <span class="flashcard-inner">

                    <span class="flashcard-face flashcard-front">
                        <span class="flashcard-meta">
                            <span class="label">${labels[0]}</span>
                            <span class="label card-index"></span>
                        </span>
                        <span class="flashcard-text" id="cardFront"></span>
                        <span class="label">Nhấn để xem đáp án</span>
                    </span>

                    <span class="flashcard-face flashcard-back">
                        <span class="flashcard-meta">
                            <span class="label">${labels[1]}</span>
                            <span class="label card-index"></span>
                        </span>
                        <span class="flashcard-text" id="cardBack"></span>
                        <span class="label">Nhấn để lật lại</span>
                    </span>

                </span>
            </button>

            <div class="deck-nav">
                <button type="button" class="deck-arrow" id="deckPrev" aria-label="Thẻ trước">←</button>
                <span class="deck-count" id="deckCount"></span>
                <button type="button" class="deck-arrow" id="deckNext" aria-label="Thẻ sau">→</button>
            </div>

        </div>
    `;

    document.getElementById("flashcard").onclick = flipCard;
    document.getElementById("deckPrev").onclick = () => moveCard(-1);
    document.getElementById("deckNext").onclick = () => moveCard(1);
    document.getElementById("deckShuffle").onclick = toggleShuffle;

    showCard();

}

function showCard() {

    const card =
        document.getElementById("flashcard");

    const { order, index } = deck;

    const total = order.length;

    // Unflip without animation so the next card's answer never shows mid-rotation.
    card.classList.add("no-anim");
    setFlipped(false);

    document.getElementById("cardFront").innerHTML =
        order[index].front;

    document.getElementById("cardBack").innerHTML =
        order[index].back;

    card.querySelectorAll(".card-index").forEach(el => {

        el.innerText = `Thẻ ${pad(index + 1)}`;

    });

    document.getElementById("deckCount").innerText =
        `${pad(index + 1)} / ${pad(total)}`;

    document.getElementById("deckProgress").style.width =
        `${(index + 1) / total * 100}%`;

    document.getElementById("deckPrev").disabled =
        index === 0;

    document.getElementById("deckNext").disabled =
        index === total - 1;

    void card.offsetWidth;
    card.classList.remove("no-anim");

}

function setFlipped(flipped) {

    const card =
        document.getElementById("flashcard");

    card.classList.toggle("is-flipped", flipped);

    card.querySelector(".flashcard-front")
        .setAttribute("aria-hidden", flipped);

    card.querySelector(".flashcard-back")
        .setAttribute("aria-hidden", !flipped);

}

function flipCard() {

    setFlipped(
        !document
            .getElementById("flashcard")
            .classList.contains("is-flipped")
    );

}

function moveCard(step) {

    const next =
        deck.index + step;

    if (next < 0 || next >= deck.order.length) return;

    deck.index = next;

    showCard();

}

function toggleShuffle() {

    const button =
        document.getElementById("deckShuffle");

    const shuffled =
        button.getAttribute("aria-pressed") !== "true";

    button.setAttribute("aria-pressed", shuffled);

    deck.order =
        shuffled ? shuffle(deck.cards) : deck.cards;

    deck.index = 0;

    showCard();

}

function shuffle(list) {

    const result = [...list];

    for (let i = result.length - 1; i > 0; i--) {

        const j =
            Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];

    }

    return result;

}

function showSummary(id) {

    const lesson =
        lessons.find(x => x.id === id);

    if (!lesson) return;

    deck = null;

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

    deck = null;

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

        return;

    }

    if (!deck) return;

    if (e.key === "ArrowRight") moveCard(1);

    if (e.key === "ArrowLeft") moveCard(-1);

    // A focused button already handles Space natively.
    if (e.key === " " && !e.target.closest("button")) {

        e.preventDefault();

        flipCard();

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
