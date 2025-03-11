class RussianLetters {
    constructor() {
        // Словарь замен букв
        this.letterReplacements = new Map([
            ['Ё', 'Е']
        ]);

        // Гласные буквы
        this.vowels = ['А', 'Е', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я'];
        
        // Согласные буквы (добавлены Ь и Ъ)
        this.consonants = [
            'Б', 'В', 'Г', 'Д', 'Ж', 'З', 'Й', 'К', 'Л', 'М', 'Н',
            'П', 'Р', 'С', 'Т', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ь'
        ];
    }

    // Нормализация буквы (замена Ё на Е и т.п.)
    normalizeLetter(letter) {
        letter = letter.toUpperCase();
        return this.letterReplacements.get(letter) || letter;
    }

    // Проверка, является ли буква гласной
    isVowel(letter) {
        return this.vowels.includes(this.normalizeLetter(letter));
    }

    // Проверка, является ли буква согласной
    isConsonant(letter) {
        return this.consonants.includes(this.normalizeLetter(letter));
    }
}

class Game {
    constructor() {
        this.gameContainer = document.querySelector('.game-container');
        this.letterStatusPopup = document.querySelector('.letter-status-popup');
        this.selectedLetter = null;
        this.wordLength = 5;
        this.russianLetters = new RussianLetters();
        this.letterStatuses = new Map();
        this.dictionary = [
            // А-В
            'АРБУЗ', 'АВТОР', 'БРОВЬ', 'ВАЛЬС',
            // Г-Д
            'ГРАНЬ', 'ДВЕРЬ', 'ДРОБЬ',
            // Ж-З
            'ЖЕСТЬ', 'ЖАБРЫ', 'ЗАБОР', 'ЗВЕРЬ',
            // И-К
            'ИГРОК', 'ИСКРА', 'КРЕСТ', 'КОЛЬТ',
            // М-Н
            'МЕТЛА', 'МЫШКА', 'НИТКА', 'НЕФТЬ',
            // О-Р
            'ОБУВЬ', 'ОКЕАН', 'РАДИО',
            // С
            'САЛЮТ', 'СВЕЧА', 'СЕТКА', 'СЛИВА', 'СПИНА',
            // Т
            'ТОЧКА', 'ТРУБА',
            // У-Х
            'УДАЛЬ', 'УЗНИК', 'УКЛОН', 'ХВОСТ', 'ХРУСТ',
            // Ц-Ч
            'ЦЕНТР', 'ЦИФРА', 'ЦУКАТ',
            // Ш-Щ
            'ШТАМП', 'ШПИЛЬ', 'ЩЕПКА', 'ЯГОДА'
        ];
        
        // Генерируем секретное слово при старте
        const randomWord = this.dictionary[Math.floor(Math.random() * this.dictionary.length)];
        this.secretWord = randomWord;
        
        this.savedTargetWord = '';
        this.startTime = Date.now(); // Добавляем время начала игры
        this.initializeGame();
        this.initializeLetterInputs();
        this.initializeAlphabet();
        this.initializeSecretWordToggle();
        this.generateInitialLeaderboard(); // Генерируем начальные рекорды
        this.initializeLeaderboard();
        this.initializeSuggestions();
    }

    initializeGame() {
        // Обработчик для кнопок отправки
        const submitButtons = document.querySelectorAll('.submit-guess');
        submitButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleGuess();
            });
        });

        // Обработчик для букв и статусов
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('letter')) {
                this.showLetterStatusPopup(e);
            } else if (!e.target.closest('.letter-status-popup')) {
                this.letterStatusPopup.style.display = 'none';
            }
        });

        // Обработчики для опций статуса
        const statusOptions = document.querySelectorAll('.status-option');
        statusOptions.forEach(option => {
            option.addEventListener('click', () => this.setLetterStatus(option.dataset.status));
        });
    }

    initializeLetterInputs() {
        const letterInputsContainers = document.querySelectorAll('.letter-inputs');
        
        letterInputsContainers.forEach(container => {
            const inputs = Array.from(container.querySelectorAll('.letter-input'));
            
            inputs.forEach((input, index) => {
                // Предотвращаем вставку через paste
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                });

                // Обработка ввода
                input.addEventListener('input', (e) => {
                    e.preventDefault();
                    
                    // Получаем введенный текст
                    let text = input.textContent || '';
                    
                    // Оставляем только первую букву в верхнем регистре
                    text = text.replace(/[^А-Яа-я]/g, '').slice(0, 1).toUpperCase();
                    
                    // Проверяем, нет ли такой буквы в других полях
                    const otherInputs = inputs.filter((_, i) => i !== index);
                    const isDuplicate = otherInputs.some(otherInput => 
                        otherInput.textContent.toUpperCase() === text
                    );
                    
                    if (isDuplicate) {
                        // Если буква уже есть - очищаем поле
                        input.textContent = '';
                        // Можно добавить визуальное оповещение
                        input.classList.add('error');
                        setTimeout(() => input.classList.remove('error'), 500);
                        return;
                    }
                    
                    // Если буква уникальная - добавляем её
                    input.textContent = text;
                    
                    // Если введена буква - переходим к следующему полю
                    if (text.length === 1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                // Обработка клавиш
                input.addEventListener('keydown', (e) => {
                    // Обработка Backspace
                    if (e.key === 'Backspace') {
                        e.preventDefault();
                        
                        // Если текущая ячейка пустая и это не первая ячейка
                        if (!input.textContent && index > 0) {
                            inputs[index - 1].textContent = '';
                            inputs[index - 1].focus();
                        } else {
                            input.textContent = '';
                        }
                    }
                    // Enter для отправки
                    else if (e.key === 'Enter') {
                        const allFilled = inputs.every(input => input.textContent.trim() !== '');
                        if (allFilled) {
                            const submitButton = container.nextElementSibling;
                            submitButton.click();
                        }
                    }
                    // Стрелки влево/вправо
                    else if (e.key === 'ArrowLeft' && index > 0) {
                        e.preventDefault();
                        inputs[index - 1].focus();
                    }
                    else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                        e.preventDefault();
                        inputs[index + 1].focus();
                    }
                });

                // Фокус выделяет содержимое
                input.addEventListener('focus', () => {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(input);
                    selection.removeAllRanges();
                    selection.addRange(range);
                });
            });

            // Добавляем обработчик Backspace на контейнер
            container.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    const inputs = Array.from(container.querySelectorAll('.letter-input'));
                    const lastInput = inputs[inputs.length - 1];
                    
                    // Если все ячейки заполнены и фокус не на последней ячейке
                    if (inputs.every(input => input.textContent.trim() !== '') && 
                        document.activeElement !== lastInput) {
                        e.preventDefault();
                        lastInput.textContent = '';
                        lastInput.focus();
                    }
                }
            });
        });
    }

    initializeAlphabet() {
        // Обновляем HTML для алфавита
        const alphabetSection = document.querySelector('.alphabet-section');
        const vowelsRow = alphabetSection.querySelector('.vowels-row');
        const consonantsRow = alphabetSection.querySelector('.consonants-row');
        
        // Очищаем существующие строки
        vowelsRow.innerHTML = '';
        consonantsRow.innerHTML = '';
        
        // Добавляем гласные
        this.russianLetters.vowels.forEach(letter => {
            const letterBox = document.createElement('div');
            letterBox.className = 'letter-box';
            letterBox.dataset.letter = letter;
            letterBox.textContent = letter;
            vowelsRow.appendChild(letterBox);
        });
        
        // Добавляем согласные
        this.russianLetters.consonants.forEach(letter => {
            const letterBox = document.createElement('div');
            letterBox.className = 'letter-box';
            letterBox.dataset.letter = letter;
            letterBox.textContent = letter;
            consonantsRow.appendChild(letterBox);
        });
    }

    updateLetterStatus(letter, status) {
        letter = this.russianLetters.normalizeLetter(letter);
        
        // Получаем элемент буквы в алфавите
        const letterBox = document.querySelector(`.letter-box[data-letter="${letter}"]`);
        if (!letterBox) return;

        // Удаляем все текущие статусы
        letterBox.classList.remove('question', 'used');

        // Применяем новый статус согласно правилам
        if (status === 'question') {
            // Синий статус (под вопросом)
            letterBox.classList.add('question');
            this.letterStatuses.set(letter, status);
        }
        else if (['pika', 'fama', 'x'].includes(status)) {
            // Единый статус для использованных букв
            letterBox.classList.add('used');
            this.letterStatuses.set(letter, 'used');
        }
        else {
            // Пустой статус (неиспользованная буква)
            this.letterStatuses.set(letter, '');
        }
    }

    handleGuess() {
        const playerSection = document.querySelector('.player-section');
        const guessInputs = playerSection.querySelectorAll('.letter-inputs[data-type="guess"] .letter-input');
        const guessesList = playerSection.querySelector('.guesses-list');
        
        const guess = Array.from(guessInputs).map(input => input.textContent).join('').toUpperCase();
        const secret = this.secretWord;
    
        if (guess.length !== this.wordLength) {
            alert(`Введите слово из ${this.wordLength} букв`);
            return;
        }

        const { pika, fama } = this.calculatePikaFama(guess, secret);
    
        const guessRow = document.createElement('div');
        guessRow.className = 'guess-row';
        
        // Получаем текущий номер строки и увеличиваем его для следующей попытки
        const currentRowNumber = parseInt(document.querySelector('.word-row.guess-input .row-number').textContent);
        
        // Добавляем номер строки к новому слову
        const rowNumber = document.createElement('div');
        rowNumber.className = 'row-number';
        rowNumber.textContent = currentRowNumber;
        guessRow.appendChild(rowNumber);
        
        const guessWord = document.createElement('div');
        guessWord.className = 'guess-word';
        
        // Получаем все предыдущие слова
        const previousGuessWords = playerSection.querySelectorAll('.guess-word');
        
        // Создаем карту статусов букв по позициям из предыдущих слов
        const letterStatusByPosition = new Map();
        // Добавляем карту для общих статусов (красный и синий)
        const letterGeneralStatus = new Map();
        
        previousGuessWords.forEach(word => {
            const letters = word.querySelectorAll('.letter');
            letters.forEach((letter, position) => {
                const letterText = this.russianLetters.normalizeLetter(letter.textContent);
                const status = Array.from(letter.classList)
                    .find(cls => ['pika', 'fama', 'question', 'x'].includes(cls));
                
                if (status) {
                    // Для пики и фамы сохраняем позиционный статус
                    if (status === 'pika' || status === 'fama') {
                        if (!letterStatusByPosition.has(position)) {
                            letterStatusByPosition.set(position, new Map());
                        }
                        letterStatusByPosition.get(position).set(letterText, status);
                    }
                    // Для вопроса и крестика сохраняем общий статус
                    else if (status === 'question' || status === 'x') {
                        // Сохраняем только если нет более приоритетного статуса
                        if (!letterGeneralStatus.has(letterText) || 
                            (status === 'x' && letterGeneralStatus.get(letterText) === 'question')) {
                            letterGeneralStatus.set(letterText, status);
                        }
                    }
                }
            });
        });

        // Применяем правила в порядке приоритета
        for (let i = 0; i < guess.length; i++) {
            const letter = this.russianLetters.normalizeLetter(guess[i]);
            const letterElement = document.createElement('div');
            letterElement.className = 'letter';
            letterElement.textContent = guess[i];

            // 1. Проверка на красный статус
            if (letterGeneralStatus.has(letter) && letterGeneralStatus.get(letter) === 'x') {
                letterElement.classList.add('x');
                this.updateLetterStatus(letter, 'x');
            }
            // 2. Проверка на синий статус
            else if (letterGeneralStatus.has(letter) && letterGeneralStatus.get(letter) === 'question') {
                letterElement.classList.add('question');
                this.updateLetterStatus(letter, 'question');
            }
            // 3. Проверка на зеленый статус (пика)
            else if (letterStatusByPosition.has(i) && 
                     letterStatusByPosition.get(i).has(letter) && 
                     letterStatusByPosition.get(i).get(letter) === 'pika') {
                letterElement.classList.add('pika');
                this.updateLetterStatus(letter, 'pika');
            }
            // 4. Проверка на желтый статус (фама)
            else if (letterStatusByPosition.has(i) && 
                     letterStatusByPosition.get(i).has(letter) && 
                     letterStatusByPosition.get(i).get(letter) === 'fama') {
                letterElement.classList.add('fama');
                this.updateLetterStatus(letter, 'fama');
            }
            
            guessWord.appendChild(letterElement);
        }
    
        const result = document.createElement('div');
        result.className = 'result';
        
        // Добавляем квадрат с количеством пик, если они есть
        if (pika > 0) {
            const pikaCount = document.createElement('div');
            pikaCount.className = 'result-count pika-count';
            pikaCount.textContent = pika;
            result.appendChild(pikaCount);
        }

        // Добавляем квадрат с количеством фам, если они есть
        if (fama > 0) {
            const famaCount = document.createElement('div');
            famaCount.className = 'result-count fama-count';
            famaCount.textContent = fama;
            result.appendChild(famaCount);
        }

        // Если нет ни пик, ни фам, добавляем красную кнопку с X
        if (pika === 0 && fama === 0) {
            // Проверяем, все ли буквы уже красные
            const letters = guessWord.querySelectorAll('.letter');
            const allLettersRed = Array.from(letters).every(letter => 
                letter.classList.contains('x')
            );
            
            // Добавляем кнопку только если не все буквы красные
            if (!allLettersRed) {
                const markAllButton = document.createElement('div');
                markAllButton.className = 'result-count mark-all-x';
                markAllButton.textContent = 'X';
                
                // Добавляем обработчик клика
                markAllButton.addEventListener('click', () => {
                    // Получаем все буквы в текущем слове
                    const letters = guessWord.querySelectorAll('.letter');
                    
                    // Создаем массив букв для обработки
                    const lettersToMark = Array.from(letters).map(letter => 
                        this.russianLetters.normalizeLetter(letter.textContent)
                    );
                    
                    // Отмечаем все буквы как красные в текущем слове
                    letters.forEach(letter => {
                        letter.classList.remove('pika', 'fama', 'question');
                        letter.classList.add('x');
                    });
                    
                    // Отмечаем все буквы как красные в других словах
                    const allGuessWords = playerSection.querySelectorAll('.guess-word');
                    allGuessWords.forEach(word => {
                        const wordLetters = word.querySelectorAll('.letter');
                        wordLetters.forEach(letter => {
                            const letterText = this.russianLetters.normalizeLetter(letter.textContent);
                            if (lettersToMark.includes(letterText)) {
                                letter.classList.remove('pika', 'fama', 'question');
                                letter.classList.add('x');
                            }
                        });
                    });
                    
                    // Обновляем статусы в алфавите
                    lettersToMark.forEach(letterText => {
                        this.updateLetterStatus(letterText, 'x');
                    });
                    
                    // Удаляем буквы из искомого слова
                    const targetInputs = playerSection.querySelectorAll('.letter-inputs[data-type="target"] .letter-input');
                    targetInputs.forEach(input => {
                        const inputLetter = this.russianLetters.normalizeLetter(input.textContent);
                        if (lettersToMark.includes(inputLetter)) {
                            input.textContent = '';
                        }
                    });
                    
                    // Удаляем кнопку после использования
                    markAllButton.remove();
                });
                
                result.appendChild(markAllButton);
            }
        }

        guessRow.appendChild(guessWord);
        guessRow.appendChild(result);
        guessesList.appendChild(guessRow);
    
        // Очищаем поля ввода
        guessInputs.forEach(input => input.textContent = '');
        guessInputs[0].focus();

        // Проверяем победу и меняем отображение
        if (pika === this.wordLength) {
            const inputArea = playerSection.querySelector('.word-row.guess-input');
            const winContainer = document.createElement('div');
            winContainer.className = 'win-container';
            
            // Получаем количество попыток
            const attemptsCount = playerSection.querySelectorAll('.guess-word').length;
            
            // Получаем время игры в секундах
            const gameTimeInSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            const formattedTime = this.formatTime(gameTimeInSeconds);
            
            // Формируем правильное окончание слова "попытки"
            let attemptsWord;
            if (attemptsCount === 1) {
                attemptsWord = 'попытки';
            } else if (attemptsCount >= 2 && attemptsCount <= 4) {
                attemptsWord = 'попытки';
            } else {
                attemptsWord = 'попыток';
            }
            
            // Сообщение о победе с количеством попыток и временем в формате mm:ss
            const winMessage = document.createElement('div');
            winMessage.className = 'win-message';
            winMessage.textContent = `Ура! Отгадали с ${attemptsCount} ${attemptsWord} и за ${formattedTime} минут!`;
            winMessage.style.cssText = `
                padding: 10px;
                background-color: #4CAF50;
                color: white;
                border-radius: 4px;
                text-align: center;
                font-weight: bold;
                margin: 10px 0;
            `;
            
            // Кнопка новой игры
            const newGameButton = document.createElement('button');
            newGameButton.className = 'new-game-button';
            newGameButton.textContent = 'Загадай новое слово';
            newGameButton.style.cssText = `
                padding: 10px 20px;
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 10px;
                width: 100%;
                transition: background-color 0.3s;
            `;
            
            newGameButton.addEventListener('mouseover', () => {
                newGameButton.style.backgroundColor = '#1976D2';
            });
            
            newGameButton.addEventListener('mouseout', () => {
                newGameButton.style.backgroundColor = '#2196F3';
            });
            
            newGameButton.addEventListener('click', () => {
                location.reload();
            });
            
            // Добавляем элементы в контейнер
            winContainer.appendChild(winMessage);
            winContainer.appendChild(newGameButton);
            
            // Заменяем блок ввода на контейнер с сообщением и кнопкой
            if (inputArea) {
                inputArea.replaceWith(winContainer);
            } else {
                guessesList.after(winContainer);
            }

            // Добавляем небольшую задержку перед запросом имени
            setTimeout(() => {
                this.addToLeaderboard(attemptsCount, gameTimeInSeconds);
            }, 100);
        }

        // Обновляем номер строки для следующей попытки
        document.querySelector('.word-row.guess-input .row-number').textContent = currentRowNumber + 1;
    }

    calculatePikaFama(guess, secret) {
        let pika = 0;
        let fama = 0;
        const usedGuessIndices = new Set();
        const usedSecretIndices = new Set();

        // Подсчет пик
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === secret[i]) {
                pika++;
                usedGuessIndices.add(i);
                usedSecretIndices.add(i);
            }
        }

        // Подсчет фам
        for (let i = 0; i < guess.length; i++) {
            if (!usedGuessIndices.has(i)) {
                for (let j = 0; j < secret.length; j++) {
                    if (!usedSecretIndices.has(j) && guess[i] === secret[j]) {
                        fama++;
                        usedSecretIndices.add(j);
                        break;
                    }
                }
            }
        }

        return { pika, fama };
    }

    showLetterStatusPopup(event) {
        const letter = event.target;
        this.selectedLetter = letter;
        
        // Получаем координаты относительно окна просмотра
        const rect = letter.getBoundingClientRect();
        const popup = this.letterStatusPopup;
        
        // Сначала отображаем попап, чтобы получить его размеры
        popup.style.display = 'block';
        popup.style.visibility = 'hidden'; // Скрываем визуально, но оставляем в DOM
        
        // Теперь у нас есть доступ к размерам попапа
        const popupHeight = popup.offsetHeight;
        
        // Позиционируем попап под буквой, учитывая скролл
        popup.style.left = `${rect.left + window.pageXOffset}px`;
        popup.style.top = `${rect.bottom + window.pageYOffset + 10}px`; // 10px отступ
        
        // Проверяем, не выходит ли попап за нижнюю границу экрана
        if (rect.bottom + popupHeight + 10 > window.innerHeight) {
            // Если выходит, показываем над буквой
            popup.style.top = `${rect.top + window.pageYOffset - popupHeight - 10}px`;
        }
        
        // Делаем попап видимым
        popup.style.visibility = 'visible';
        
        // Подсвечиваем текущий статус буквы
        const letterText = this.russianLetters.normalizeLetter(letter.textContent);
        const currentStatus = Array.from(letter.classList)
            .find(cls => ['pika', 'fama', 'question', 'x'].includes(cls)) || '';
        
        const statusOptions = popup.querySelectorAll('.status-option');
        statusOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.status === currentStatus) {
                option.classList.add('active');
            }
        });
    }

    setLetterStatus(status) {
        if (!this.selectedLetter) return;
    
        const playerSection = document.querySelector('.player-section');
        const letter = this.russianLetters.normalizeLetter(this.selectedLetter.textContent);
        const selectedLetterIndex = Array.from(this.selectedLetter.parentElement.children).indexOf(this.selectedLetter);
        const targetInputs = playerSection.querySelectorAll('.letter-inputs[data-type="target"] .letter-input');
        const guessWords = playerSection.querySelectorAll('.guess-word');

        switch(status) {
            case 'x': // Красный - высший приоритет
                guessWords.forEach(word => {
                    const letters = word.querySelectorAll('.letter');
                    letters.forEach(letterElement => {
                        if (this.russianLetters.normalizeLetter(letterElement.textContent) === letter) {
                            letterElement.classList.remove('pika', 'fama', 'question', 'x');
                            letterElement.classList.add('x');
                        }
                    });
                });
                this.updateLetterStatus(letter, 'x');
                targetInputs.forEach(input => {
                    if (this.russianLetters.normalizeLetter(input.textContent) === letter) {
                        input.textContent = '';
                    }
                });
                break;

            case 'question': // Синий - второй приоритет
                guessWords.forEach(word => {
                    const letters = word.querySelectorAll('.letter');
                    letters.forEach(letterElement => {
                        if (this.russianLetters.normalizeLetter(letterElement.textContent) === letter) {
                            letterElement.classList.remove('pika', 'fama', 'question', 'x');
                            letterElement.classList.add('question');
                        }
                    });
                });
                this.updateLetterStatus(letter, 'question');
                targetInputs.forEach(input => {
                    if (this.russianLetters.normalizeLetter(input.textContent) === letter) {
                        input.textContent = '';
                    }
                });
                break;

            case 'pika': // Зеленый - третий приоритет
                guessWords.forEach(word => {
                    const letters = word.querySelectorAll('.letter');
                    letters.forEach((letterElement, index) => {
                        if (this.russianLetters.normalizeLetter(letterElement.textContent) === letter) {
                            letterElement.classList.remove('pika', 'fama', 'question', 'x');
                            letterElement.classList.add(index === selectedLetterIndex ? 'pika' : 'fama');
                        }
                    });
                });
                this.updateLetterStatus(letter, 'pika');
                targetInputs[selectedLetterIndex].textContent = letter;
                break;

            case 'fama': // Желтый - четвертый приоритет
                guessWords.forEach(word => {
                    const letters = word.querySelectorAll('.letter');
                    letters.forEach((letterElement, index) => {
                        if (this.russianLetters.normalizeLetter(letterElement.textContent) === letter && 
                            index === selectedLetterIndex) {
                            letterElement.classList.remove('pika', 'fama', 'question', 'x');
                            letterElement.classList.add('fama');
                        }
                    });
                });
                // Не меняем статус в алфавите, если он уже зеленый
                if (this.letterStatuses.get(letter) !== 'pika') {
                    this.updateLetterStatus(letter, 'fama');
                }
                // Обработка искомого слова
                if (targetInputs[selectedLetterIndex].textContent === letter) {
                    targetInputs[selectedLetterIndex].textContent = '';
                }
                break;

            default: // Серый - последний приоритет
                guessWords.forEach(word => {
                    const letters = word.querySelectorAll('.letter');
                    letters.forEach(letterElement => {
                        if (this.russianLetters.normalizeLetter(letterElement.textContent) === letter) {
                            letterElement.classList.remove('pika', 'fama', 'question', 'x');
                        }
                    });
                });
                this.updateLetterStatus(letter, '');
                targetInputs.forEach(input => {
                    if (this.russianLetters.normalizeLetter(input.textContent) === letter) {
                        input.textContent = '';
                    }
                });
                break;
        }

        this.letterStatusPopup.style.display = 'none';
    }

    initializeSecretWordToggle() {
        const toggleButton = document.querySelector('.toggle-secret-word');
        let isSecretVisible = false;
        let savedLetters = [];

        toggleButton.addEventListener('click', () => {
            const targetWordRow = document.querySelector('.target-word');
            const letterInputs = targetWordRow.querySelectorAll('.letter-input');
            
            if (!isSecretVisible) {
                // Сохраняем текущие буквы
                savedLetters = Array.from(letterInputs).map(input => input.textContent);
                
                // Показываем загаданное слово
                Array.from(this.secretWord).forEach((letter, index) => {
                    letterInputs[index].textContent = letter;
                });
                
                // Меняем иконку на "перечеркнутый глаз"
                toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                // Восстанавливаем сохраненные буквы
                savedLetters.forEach((letter, index) => {
                    letterInputs[index].textContent = letter;
                });
                
                // Меняем иконку обратно на "глаз"
                toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
            }
            
            isSecretVisible = !isSecretVisible;
        });
    }

    // Метод для форматирования времени
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    generateInitialLeaderboard() {
        // Список имен (9 вместо 10)
        const names = [
            'Александр', 'Мария', 'Дмитрий', 'Анна', 
            'Сергей', 'Елена', 'Михаил', 'Ольга', 'Андрей'
        ];

        // Перемешиваем имена
        const shuffledNames = [...names].sort(() => Math.random() - 0.5);

        // Генерируем рекорды (9 записей)
        const records = shuffledNames.map(name => {
            // Генерируем случайное количество попыток (от 2 до 8)
            const attempts = Math.floor(Math.random() * 7) + 2;
            
            // Генерируем случайное время (от 30 секунд до 5 минут)
            const timeInSeconds = Math.floor(Math.random() * (300 - 30 + 1)) + 30;
            
            // Рассчитываем счет
            const score = this.calculateScore(attempts, timeInSeconds);

            return {
                name,
                attempts,
                time: timeInSeconds,
                score
            };
        });

        // Сортируем по счету и сохраняем
        records.sort((a, b) => b.score - a.score);
        localStorage.setItem('leaderboard', JSON.stringify(records));
    }

    initializeLeaderboard() {
        // Если таблица рекордов пуста, генерируем начальные данные
        if (!localStorage.getItem('leaderboard')) {
            this.generateInitialLeaderboard();
        }
        
        this.leaderboard = JSON.parse(localStorage.getItem('leaderboard'));
        this.updateLeaderboardDisplay();
    }

    calculateScore(attempts, timeInSeconds) {
        // Базовый счет начинается с 1000
        let score = 1000;
        
        // Вычитаем очки за каждую попытку (100 очков за попытку)
        score -= (attempts - 1) * 100;
        
        // Вычитаем очки за время (1 очко за каждые 2 секунды)
        score -= Math.floor(timeInSeconds / 2);
        
        // Минимальный счет - 0
        return Math.max(0, score);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateLeaderboardDisplay() {
        const tbody = document.querySelector('.leaderboard-table tbody');
        tbody.innerHTML = '';
        
        this.leaderboard.forEach((record, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.score}</td>
                <td>${record.name}</td>
                <td>${record.attempts}</td>
                <td>${this.formatTime(record.time)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    addToLeaderboard(attempts, timeInSeconds) {
        const score = this.calculateScore(attempts, timeInSeconds);
        
        // Запрашиваем имя игрока
        const playerName = prompt('Поздравляем! Введите ваше имя для таблицы рекордов:', 'Игрок');
        
        if (playerName) {
            // Добавляем новый результат
            const newRecord = {
                score,
                name: playerName,
                attempts,
                time: timeInSeconds
            };
            
            // Добавляем новый результат и сортируем
            this.leaderboard.push(newRecord);
            this.leaderboard.sort((a, b) => b.score - a.score);
            this.leaderboard = this.leaderboard.slice(0, 10);
            
            // Сохраняем в localStorage
            localStorage.setItem('leaderboard', JSON.stringify(this.leaderboard));
            
            // Находим секцию таблицы рекордов и разворачиваем её
            const leaderboardSection = document.querySelector('.leaderboard-section');
            if (leaderboardSection.classList.contains('collapsed')) {
                toggleSection(leaderboardSection);
            }
            
            // Обновляем отображение с подсветкой новой записи
            const tbody = document.querySelector('.leaderboard-table tbody');
            tbody.innerHTML = '';
            
            this.leaderboard.forEach((record) => {
                const row = document.createElement('tr');
                // Добавляем "(ВЫ)" к имени игрока
                const displayName = record.name === playerName ? `${record.name} (ВЫ)` : record.name;
                row.innerHTML = `
                    <td>${record.score}</td>
                    <td>${displayName}</td>
                    <td>${record.attempts}</td>
                    <td>${this.formatTime(record.time)}</td>
                `;
                tbody.appendChild(row);
                
                // Подсвечиваем новую запись
                if (record.name === playerName) {
                    row.classList.add('highlight');
                    // Убираем подсветку через 2 секунды
                    setTimeout(() => {
                        row.classList.remove('highlight');
                    }, 2000);
                }
            });
        }
    }

    initializeSuggestions() {
        const suggestionsButton = document.querySelector('.suggestions-button');
        const suggestionsDropdown = document.querySelector('.suggestions-dropdown');
        const suggestionsList = document.querySelector('.suggestions-list');

        // Обработчик клика по кнопке подсказок
        suggestionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.updateSuggestions();
            suggestionsDropdown.classList.toggle('active');
        });

        // Закрытие выпадающего списка при клике вне его
        document.addEventListener('click', (e) => {
            if (!suggestionsDropdown.contains(e.target) && 
                !suggestionsButton.contains(e.target)) {
                suggestionsDropdown.classList.remove('active');
            }
        });
    }

    updateSuggestions() {
        const inputs = Array.from(document.querySelectorAll('.letter-inputs[data-type="guess"] .letter-input'));
        const currentPattern = inputs.map(input => input.textContent.toUpperCase() || '.').join('');
        const suggestionsList = document.querySelector('.suggestions-list');

        // Получаем список уже использованных слов
        const usedWords = Array.from(document.querySelectorAll('.guess-word')).map(wordElement => wordElement.textContent.trim().toUpperCase());

        // Фильтруем словарь по текущему паттерну
        const suggestions = this.dictionary.filter(word => {
            // Проверяем, соответствует ли слово текущему паттерну
            for (let i = 0; i < word.length; i++) {
                if (currentPattern[i] !== '.' && currentPattern[i] !== word[i]) {
                    return false;
                }
            }
            // Исключаем уже использованные слова
            return !usedWords.includes(word.toUpperCase());
        }).sort();

        // Ограничиваем количество предложений
        const limitedSuggestions = suggestions.slice(0, 100);

        // Обновляем список предложений
        suggestionsList.innerHTML = '';
        limitedSuggestions.forEach(word => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = word;
            item.addEventListener('click', () => this.applySuggestion(word));
            suggestionsList.appendChild(item);
        });
    }

    applySuggestion(word) {
        const inputs = document.querySelectorAll('.letter-inputs[data-type="guess"] .letter-input');
        Array.from(word).forEach((letter, index) => {
            inputs[index].textContent = letter;
        });
        
        // Закрываем выпадающий список
        document.querySelector('.suggestions-dropdown').classList.remove('active');
        
        // Имитируем нажатие кнопки Send
        this.handleGuess();
    }
}

// Инициализация игры после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});

function toggleSection(section) {
    section.classList.toggle('collapsed');
}

// При загрузке страницы сворачиваем секции
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.collapsible');
    sections.forEach(section => {
        section.classList.add('collapsed');
    });
});