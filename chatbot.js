document.addEventListener('DOMContentLoaded', () => {
    const chatbotPopup = document.getElementById('chatbot-popup');
    const mobileChatbotToggleBtn = document.getElementById('mobile-chatbot-toggle');
    const desktopChatbotToggleBtn = document.getElementById('desktop-chatbot-toggle');
    const chatbotCloseBtn = document.getElementById('chatbot-close-btn');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSendBtn = document.getElementById('chatbot-send-btn');
    const chatbotBody = document.getElementById('chatbot-body');

    // رقم الواتساب للدعم الفني (ضع رقمك هنا)
    const whatsappNumber = '966565464718'; //
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=مرحباً، لدي سؤال بخصوص خدمات وُجْهَة.`;

    // الأسئلة المقترحة التلقائية
    const suggestedQuestions = [
        "كيف يمكنني تأجير سيارة؟",
        "ما هي شروط تأجير السيارات؟",
        "هل السيارات مؤمن عليها؟",
        "كيف يمكنني إضافة سيارتي للتأجير؟",
        "ماذا أفعل في حالة وقوع حادث؟",
        "شروط وأحكام الاستئجار؟",
        "دليل المستخدم؟",
        "كيف أتواصل مع الدعم الفني؟"
    ];

    // دالة لعرض رسالة في البوت (للمستخدم أو البوت)
    function displayMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        messageDiv.textContent = text;
        chatbotBody.appendChild(messageDiv);
        scrollToBottom();
    }

    // دالة لعرض الأسئلة المقترحة
    function displaySuggestedQuestions() {
        // إزالة أي أسئلة مقترحة سابقة لتجنب التكرار
        const existingSuggested = chatbotBody.querySelector('.suggested-questions-container');
        if (existingSuggested) {
            existingSuggested.remove();
        }
        const existingIntro = chatbotBody.querySelector('.suggested-intro-message');
        if (existingIntro) {
            existingIntro.remove();
        }

        const questionsContainer = document.createElement('div');
        questionsContainer.classList.add('suggested-questions-container');
        
        const introMessage = document.createElement('div');
        introMessage.classList.add('bot-message', 'suggested-intro-message');
        introMessage.textContent = "يمكنني الإجابة على الأسئلة التالية:";
        chatbotBody.appendChild(introMessage);

        suggestedQuestions.forEach(question => {
            const questionBtn = document.createElement('button');
            questionBtn.classList.add('suggested-question-btn');
            questionBtn.textContent = question;
            questionBtn.addEventListener('click', () => {
                displayMessage(question, 'user');
                chatbotInput.value = question; // ضع السؤال في حقل الإدخال
                sendMessage(); // أرسل السؤال تلقائياً
            });
            questionsContainer.appendChild(questionBtn);
        });
        chatbotBody.appendChild(questionsContainer);
        scrollToBottom();
    }

    // دالة لتبديل رؤية البوت
    function toggleChatbot() {
        chatbotPopup.classList.toggle('open');
        if (chatbotPopup.classList.contains('open')) {
            // عرض رسالة ترحيبية والأسئلة المقترحة عند الفتح لأول مرة أو إذا لم تكن موجودة
            // تحقق من أن الرسالة الافتراضية للبوت موجودة فقط أو لا توجد رسائل أخرى
            if (chatbotBody.children.length === 1 && chatbotBody.children[0].textContent.includes("مرحباً بك! أنا مساعد وُجْهَة")) {
                displaySuggestedQuestions();
            } else if (chatbotBody.children.length === 0) { // في حالة إعادة تعيين البوت أو لأول مرة تماماً
                 displayMessage("مرحباً بك! أنا مساعد وُجْهَة، كيف يمكنني مساعدتك اليوم؟", "bot");
                 displaySuggestedQuestions();
            }
            chatbotInput.focus();
            scrollToBottom();
        }
    }

    // ربط حدث النقر بزر الجوال
    if (mobileChatbotToggleBtn) {
        mobileChatbotToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChatbot();
        });
    }

    // ربط حدث النقر بزر الديسكتوب
    if (desktopChatbotToggleBtn) {
        desktopChatbotToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChatbot();
        });
    }

    // إغلاق البوت
    if (chatbotCloseBtn) {
        chatbotCloseBtn.addEventListener('click', () => {
            chatbotPopup.classList.remove('open');
        });
    }

    // إرسال رسالة
    function sendMessage() {
        const messageText = chatbotInput.value.trim();
        if (messageText === '') return;

        displayMessage(messageText, 'user');
        chatbotInput.value = ''; // مسح حقل الإدخال

        // الحصول على رد البوت
        setTimeout(() => {
            const botResponse = generateBotResponse(messageText);
            displayMessage(botResponse.text, 'bot');
            
            // إذا كان الرد يتطلب تحويل للدعم الفني
            if (botResponse.action === 'whatsapp_redirect') {
                const whatsappBtnDiv = document.createElement('div');
                whatsappBtnDiv.classList.add('bot-message', 'whatsapp-link-container');
                const whatsappLinkElement = document.createElement('a');
                whatsappLinkElement.href = whatsappLink;
                whatsappLinkElement.target = "_blank";
                whatsappLinkElement.classList.add('btn', 'btn-primary', 'whatsapp-btn'); // استخدام أنماط الأزرار الموجودة
                whatsappLinkElement.innerHTML = '<i class="fab fa-whatsapp"></i> تواصل عبر واتساب';
                whatsappBtnDiv.appendChild(whatsappLinkElement);
                chatbotBody.appendChild(whatsappBtnDiv);
            } else if (botResponse.action === 'suggest_more_questions') {
                 // عرض الأسئلة المقترحة مرة أخرى إذا لم يتم الفهم
                 displaySuggestedQuestions();
            }
            scrollToBottom();
        }, 500); // محاكاة تأخير البوت
    }

    // ربط حدث الإرسال
    if (chatbotSendBtn) {
        chatbotSendBtn.addEventListener('click', sendMessage);
    }

    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // تمرير شاشة الدردشة للأسفل
    function scrollToBottom() {
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }

    // منطق رد البوت (تم تحديثه للتعامل مع الأسئلة المقترحة وتحويل الواتساب)
    function generateBotResponse(message) {
        const lowerCaseMessage = message.toLowerCase();

        // Check for exact match with suggested questions
        if (suggestedQuestions.includes(message)) {
            // If it's a suggested question, directly map to a specific answer
            if (message.includes("كيف يمكنني تأجير سيارة؟")) {
                return { text: "يمكنك تأجير سيارة من خلال تطبيق وُجْهَة أو الموقع الإلكتروني. ابحث عن السيارة المناسبة، حدد تواريخ الإيجار، ثم أكمل الحجز والدفع.", action: null };
            } else if (message.includes("ما هي شروط تأجير السيارات؟")) {
                return { text: "تنص شروط الاستئجار على أن المستأجر يجب أن يكون حاصلاً على رخصة قيادة سارية المفعول (سعودية أو دولية معترف بها)، والحد الأدنى للعمر هو 21 عامًا. يجب تقديم بطاقة هوية سارية المفعول (هوية وطنية أو إقامة).", action: null };
            } else if (message.includes("هل السيارات مؤمن عليها؟")) {
                return { text: "نعم، جميع السيارات المتوفرة على منصة وُجْهَة مؤمنة بالكامل لضمان سلامتك وسلامة السيارة خلال فترة الإيجار.", action: null };
            } else if (message.includes("كيف يمكنني إضافة سيارتي للتأجير؟")) {
                return { text: "يمكنك التسجيل كمالك سيارة عبر الموقع أو التطبيق، ثم إضافة تفاصيل سيارتك وصورها. بعد مراجعة واعتماد سيارتك، ستصبح متاحة للتأجير.", action: null };
            } else if (message.includes("ماذا أفعل في حالة وقوع حادث؟")) {
                return { text: "في حالة وقوع حادث، يجب عليك أولاً التأكد من سلامة الجميع. ثم قم بإبلاغ وُجْهَة على الفور، وسنقدم لك الدعم والإرشادات اللازمة للتعامل مع الموقف.", action: null };
            } else if (message.includes("شروط وأحكام الاستئجار؟")) {
                 return { text: "تجد الشروط والأحكام الكاملة للاستئجار على صفحة شروط الاستئجار، وتشمل الأهلية، فترة الإيجار، التأمين، الوقود، وإلغاء الحجز.", action: null };
            } else if (message.includes("دليل المستخدم؟")) {
                return { text: "يمكنك الاطلاع على دليل المستخدم الذي يشرح بالتفصيل كيفية استخدام المنصة للمستأجرين والمالكين، بما في ذلك التسجيل، البحث عن السيارات، إضافة السيارات، وإدارة الحجوزات.", action: null };
            } else if (message.includes("كيف أتواصل مع الدعم الفني؟")) {
                return { text: "إذا لم تجد إجابتك هنا، يمكنك التواصل مع فريق الدعم الفني عبر واتساب لمزيد من المساعدة.", action: "whatsapp_redirect" };
            }
        }

        // Keyword-based responses (for free-form questions)
        if (lowerCaseMessage.includes('شروط الاستئجار') || lowerCaseMessage.includes('شروط التأجير')) {
            return { text: "تنص شروط الاستئجار على أن المستأجر يجب أن يكون حاصلاً على رخصة قيادة سارية المفعول (سعودية أو دولية معترف بها)، والحد الأدنى للعمر هو 21 عامًا. يجب تقديم بطاقة هوية سارية المفعول (هوية وطنية أو إقامة).", action: null };
        }
        if (lowerCaseMessage.includes('فترة الإيجار') || lowerCaseMessage.includes('مدة الإيجار')) {
            return { text: "تُحسب فترة الإيجار على أساس 24 ساعة لكل يوم. يتم تحديد وقت الاستلام والإرجاع في عقد الإيجار، وقد تؤدي أي تأخير إلى رسوم إضافية.", action: null };
        }
        if (lowerCaseMessage.includes('التأمين') || lowerCaseMessage.includes('مؤمنة')) {
            return { text: "تشمل جميع الإيجارات تأمينًا ضد الغير. يمكن للمستأجر اختيار تأمين شامل إضافي. المستأجر يتحمل مسؤولية الأضرار الناتجة عن سوء الاستخدام أو الإهمال.", action: null };
        }
        if (lowerCaseMessage.includes('الوقود') || lowerCaseMessage.includes('البنزين')) {
            return { text: "يتم تسليم السيارة بوقود كامل، ويجب إرجاعها بوقود كامل. في حالة عدم امتلاء الخزان، سيتم احتساب رسوم إعادة تعبئة بالإضافة إلى تكلفة الوقود.", action: null };
        }
        if (lowerCaseMessage.includes('إلغاء الحجز') || lowerCaseMessage.includes('إلغاء الحجوزات')) {
            return { text: "يمكن إلغاء الحجوزات قبل 24 ساعة من موعد الاستلام دون رسوم. الإلغاءات التي تتم في أقل من 24 ساعة قد تخضع لرسوم إلغاء.", action: null };
        }
        if (lowerCaseMessage.includes('المخالفات المرورية') || lowerCaseMessage.includes('غرامات')) {
            return { text: "المستأجر مسؤول عن جميع المخالفات المرورية والغرامات التي تحدث خلال فترة الإيجار.", action: null };
        }
        if (lowerCaseMessage.includes('كيف استأجر سيارة') || lowerCaseMessage.includes('تأجير سيارة')) {
            return { text: "يمكنك تأجير سيارة من خلال تطبيق وُجْهَة أو الموقع الإلكتروني. ابحث عن السيارة المناسبة، حدد تواريخ الإيجار، ثم أكمل الحجز والدفع.", action: null };
        }
        if (lowerCaseMessage.includes('أضيف سيارتي') || lowerCaseMessage.includes('اضافة سيارة') || lowerCaseMessage.includes('أضيف سيارة')) {
            return { text: "يمكنك التسجيل كمالك سيارة عبر الموقع أو التطبيق، ثم إضافة تفاصيل سيارتك وصورها. بعد مراجعة واعتماد سيارتك، ستصبح متاحة للتأجير.", action: null };
        }
        if (lowerCaseMessage.includes('حادث') || lowerCaseMessage.includes('حوادث')) {
            return { text: "في حالة وقوع حادث، يجب عليك أولاً التأكد من سلامة الجميع. ثم قم بإبلاغ وُجْهَة على الفور، وسنقدم لك الدعم والإرشادات اللازمة للتعامل مع الموقف.", action: null };
        }
        if (lowerCaseMessage.includes('دليل المستخدم') || lowerCaseMessage.includes('كيف استخدم المنصة')) {
            return { text: "يمكنك الاطلاع على دليل المستخدم الشامل للحصول على معلومات مفصلة حول كيفية استخدام منصة وُجْهَة لكل من المستأجرين والمالكين.", action: null };
        }
        if (lowerCaseMessage.includes('اتصل') || lowerCaseMessage.includes('تواصل معنا') || lowerCaseMessage.includes('رقم الهاتف')) {
            return { text: "يمكنك التواصل معنا عبر الهاتف على الرقم +966 56 546 4718 أو عبر البريد الإلكتروني q_p@outlook.cl.", action: null };
        }
        if (lowerCaseMessage.includes('عن وُجْهَة')) {
            return { text: "وُجْهَة هي أول منصة سعودية متخصصة في تأجير السيارات بين الأفراد بثقة وأمان وسهولة تامة. نسعى لتحويل السيارات الواقعة إلى أصول منتجة.", action: null };
        }


        // General greetings and fallback
        if (lowerCaseMessage.includes('مرحبا') || lowerCaseMessage.includes('سلام')) {
            return { text: "أهلاً بك! كيف يمكنني مساعدتك؟", action: "suggest_more_questions" };
        }
        if (lowerCaseMessage.includes('شكرا') || lowerCaseMessage.includes('شكرًا')) {
            return { text: "على الرحب والسعة!", action: null };
        }

        // Fallback to WhatsApp if no answer is found
        return { text: "عذرًا، لم أفهم سؤالك أو لم أجد إجابة محددة له. هل تود التحدث مع فريق الدعم الفني لدينا عبر واتساب؟", action: "whatsapp_redirect" };
    }

    // عرض الأسئلة المقترحة عند تحميل البوت لأول مرة (إذا لم يكن هناك سجل محادثات)
    // هذا الجزء تم نقله إلى دالة toggleChatbot ليعرض الأسئلة فقط عند فتح البوت
});
