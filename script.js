/* ===================================
   INICIALIZAÇÃO DO SISTEMA
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ZYO-OS Documentation Initialized');
    
    // Inicializar armazenamento de sessão (não persistente - reseta ao recarregar)
    window.zyoSessionSteps = {};
    
    // Inicializar todos os módulos
    initializeNavigation();
    initializeCodeCopy();
    initializeProgressTracking();
    initializeSmoothScroll();
    initializeResponsiveMenu();
    initializeSectionObserver();
    initializeQuickActions();
    initializeNotifications();
    
    // Atualizar progresso inicial
    updateProgressBar();
    updateStepCounters();
    
    // Animar elementos na entrada
    setTimeout(() => {
        animateElementsOnLoad();
    }, 100);
});

/* ===================================
   MÓDULO DE NAVEGAÇÃO
   =================================== */

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    if (navItems.length === 0 || sections.length === 0) return;
    
    // Ativar navegação por clique
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const sectionId = item.getAttribute('href').substring(1);
            const targetSection = document.getElementById(sectionId);
            
            if (!targetSection) return;
            
            // Remover ativo de todos
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Adicionar ativo ao item clicado
            item.classList.add('active');
            
            // Scroll suave para a seção
            scrollToSection(targetSection);
            
            // Atualizar URL sem recarregar
            history.pushState(null, null, `#${sectionId}`);
            
            // Fechar menu mobile ao clicar em um item
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar && sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                    const toggleBtn = document.querySelector('.menu-toggle');
                    if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });
    
    // Atualizar navegação ao scroll
    window.addEventListener('scroll', () => {
        updateActiveNavOnScroll(sections, navItems);
    });
    
    // Lidar com botões de navegação
    document.querySelectorAll('.btn-primary').forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes('goToSection')) {
            btn.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-primary')) return;
                const sectionId = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
                goToSection(sectionId);
            });
        }
    });
}

function scrollToSection(section) {
    const headerOffset = 100;
    const sectionPosition = section.getBoundingClientRect().top;
    const offsetPosition = sectionPosition + window.pageYOffset - headerOffset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

function updateActiveNavOnScroll(sections, navItems) {
    let currentSectionId = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id');
        
        if (window.pageYOffset >= sectionTop && 
            window.pageYOffset < sectionTop + sectionHeight) {
            currentSectionId = sectionId;
        }
    });
    
    // Atualizar item ativo no menu
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${currentSectionId}`) {
            item.classList.add('active');
        }
    });
}

function goToSection(sectionId) {
    const section = document.getElementById(sectionId);
    const navItem = document.querySelector(`.nav-item[href="#${sectionId}"]`);
    
    if (section && navItem) {
        navItem.click();
    }
}

/* ===================================
   MÓDULO DE CÓPIA DE CÓDIGO (ATUALIZADO)
   =================================== */

function initializeCodeCopy() {
    // Adicionar botões de cópia a todos os blocos de código
    const codeBlocks = document.querySelectorAll('.code-block pre');
    
    codeBlocks.forEach((block, index) => {
        const commandBox = block.closest('.code-block');
        if (!commandBox) return;
        
        // Gerar um ID único para este bloco de código (Garantir que exista)
        let codeId = commandBox.getAttribute('data-code-id');
        if (!codeId) {
            codeId = `code-${index}-${Date.now()}`;
            commandBox.setAttribute('data-code-id', codeId);
        }
        
        // Verificar se já tem botão
        const existingButton = commandBox.querySelector('.btn-copy');
        if (existingButton) return;
        
        // Encontrar o header
        const header = commandBox.querySelector('.code-block-header');
        if (!header) return;
        
        // Criar botão de cópia
        const copyButton = document.createElement('button');
        copyButton.className = 'btn btn-copy';
        copyButton.innerHTML = '<i class="far fa-copy"></i> <span>Copiar</span>';
        copyButton.setAttribute('data-code-id', codeId);
        
        // Adicionar ao header (SEM event listener aqui - será capturado pela delegação)
        header.appendChild(copyButton);
    });
    
    // Adicionar funcionalidade de copiar código inline
    document.querySelectorAll('.code-inline').forEach(inlineCode => {
        inlineCode.style.cursor = 'pointer';
        inlineCode.title = 'Clique para copiar';
        
        inlineCode.addEventListener('click', () => {
            const code = inlineCode.textContent.trim();
            copyToClipboardWithJoin(code);
            showNotification('Código copiado!', 'success');
            
            // Feedback visual
            inlineCode.style.backgroundColor = 'var(--success-light)';
            setTimeout(() => {
                inlineCode.style.backgroundColor = '';
            }, 1000);
        });
    });
}

// Função global usada pelos botões inline no HTML: onclick="copyCode(this)"
function copyCode(buttonOrElement) {
    if (!buttonOrElement) return;

    let button = buttonOrElement;

    // Se foi passado um elemento filho (ex: o <i> dentro do botão), encontrar o botão pai
    if (!(button instanceof HTMLElement) || !button.classList.contains('btn-copy')) {
        if (button instanceof HTMLElement && button.closest) {
            button = button.closest('.btn-copy');
        }
    }

    if (!button) return;

    // Chama a rotina existente que faz a cópia e feedback
    try {
        copyCodeWithProgress(button);
    } catch (err) {
        console.error('copyCode wrapper failed:', err);
    }
}

// Tornar a função disponível globalmente para handlers inline
try {
    window.copyCode = copyCode;
} catch (e) {
    // ambiente sem window (ex: testes) — ignorar
}

// DELEGAÇÃO DE EVENTO ÚNICA para capturar cliques em botões .btn-copy
document.addEventListener('click', (e) => {
    const target = e.target;
    const btn = target.closest && target.closest('.btn-copy');
    if (btn) {
        e.preventDefault();
        e.stopPropagation(); // Impedir que o evento se propague
        try {
            copyCodeWithProgress(btn);
        } catch (err) {
            console.error('Copy handler failed:', err);
            showNotification('Erro ao copiar o conteúdo', 'error');
        }
    }
}, true); // Usar capture phase para interceptar antes de outras listeners

function copyCodeWithProgress(button) {
    if (!button) return;
    
    const codeBlock = button.closest('.code-block');
    if (!codeBlock) return;
    
    const codeId = codeBlock.getAttribute('data-code-id');
    const codeElement = codeBlock.querySelector('pre code');
    if (!codeElement) return;
    
    // Extrair código do bloco e formatar com &&
    let code = codeElement.textContent;
    code = formatCodeWithJoin(code);
    
    // Copiar para clipboard
    copyToClipboard(code);
    
    // Marcar como copiado e atualizar progresso
    const isFirstCopy = markCodeAsCopied(codeId);
    
    // Feedback visual do botão (Permanente)
    button.innerHTML = '<i class="fas fa-check"></i> <span>Copiado!</span>';
    button.className = 'btn btn-copy copied';
    
    // Marcar card como completo visualmente
    const stepCard = button.closest('.step-card');
    if (stepCard) {
        stepCard.classList.add('step-completed');
    }
    
    // Notificação com feedback de progresso
    if (isFirstCopy) {
        // Calcular progresso apenas de itens essenciais
        const allStepCards = document.querySelectorAll('.step-card');
        let totalEssential = 0;
        allStepCards.forEach(card => {
            const stepNum = card.querySelector('.step-number');
            if (stepNum && isEssentialStep(stepNum.textContent.trim())) {
                totalEssential++;
            }
        });
        
        const completedEssential = Object.keys(window.zyoSessionSteps).filter(id => isEssentialStep(id)).length;
        const percentage = totalEssential > 0 ? Math.round((completedEssential / totalEssential) * 100) : 0;
        showNotification(`Código copiado! Progresso: ${percentage}%`, 'success');
    } else {
        showNotification('Código copiado!', 'success');
    }
}

function formatCodeWithJoin(code) {
    // Remove espaços em branco no início e fim
    code = code.trim();
    
    // Se já estiver formatado com &&, mantém como está
    if (code.includes(' && ')) {
        return code;
    }
    
    // IMPORTANTE: Se for um heredoc (cat > arquivo << 'EOF'), retorna como está!
    // Heredocs não podem ter && entre as linhas
    if (code.includes("<< 'EOF'") || code.includes('<< "EOF"') || code.includes('<<EOF')) {
        return code;
    }
    
    // CORREÇÃO: Se o código contém barras invertidas para quebra de linha, retorna como está.
    if (code.includes(' \\') || code.includes('\\\n')) {
        return code;
    }
    
    // Divide o código em linhas
    const lines = code.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
    
    // Remove comentários inline
    const cleanLines = lines.map(line => {
        const commentIndex = line.indexOf('#');
        return commentIndex > 0 ? line.substring(0, commentIndex).trim() : line;
    }).filter(line => line.length > 0);
    
    // Se houver apenas uma linha, retorna ela
    if (cleanLines.length <= 1) {
        return cleanLines[0] || '';
    }
    
    // Junta as linhas com &&
    return cleanLines.join(' && ');
}

function copyToClipboardWithJoin(text) {
    const formattedText = formatCodeWithJoin(text);
    return copyToClipboard(formattedText);
}

function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => resolve(true))
                .catch(err => {
                    console.error('Clipboard API failed:', err);
                    fallbackCopy(text) ? resolve(true) : reject(err);
                });
        } else {
            fallbackCopy(text) ? resolve(true) : reject(new Error('Copy failed'));
        }
    });
}

function fallbackCopy(text) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        return successful;
    } catch (err) {
        console.error('Fallback copy failed:', err);
        return false;
    }
}

/* ===================================
   MÓDULO DE PROGRESSO (ATUALIZADO)
   =================================== */

function initializeProgressTracking() {
    // Definir todos os passos da criação da distro
    setupAllSteps();
    
    // Carregar progresso salvo
    // loadProgress(); // Desativado para não carregar progresso anterior
    
    // Atualizar contadores iniciais
    updateProgressBar();
    updateStepCounters();
}

// Lista de todos os passos da criação da distro (10 partes principais)
const DISTRO_CREATION_STEPS = [
    // Parte 1: Preparação (2 passos)
    '1.1', '1.2',
    
    // Parte 2: Sistema Base (8 passos)
    '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8',
    
    // Parte 3: Kernel (4 passos)
    '3.1', '3.2', '3.3', '3.4',
    
    // Parte 4: Usuários (2 passos)
    '4.1', '4.2',
    
    // Parte 5: GNOME (5 passos)
    '5.1', '5.2', '5.3', '5.4', '5.5',
    
    // Parte 6: Extensões GNOME (3 passos)
    '6.1', '6.2', '6.3',
    
    // Parte 7: Segurança (2 passos)
    '7.1', '7.2',
    
    // Parte 8: Personalização (5 passos)
    '8.1', '8.2', '8.3', '8.4', '8.5',
    
    // Parte 9: Instalador (2 passos)
    '9.1', '9.2',
    
    // Parte 10: Gerar ISO (12 passos)
    '10.1', '10.2', '10.3', '10.4', '10.5', '10.6',
    '10.7', '10.8', '10.9', '10.10', '10.11', '10.12'
];

function setupAllSteps() {
    // Mapear cada bloco de código para um passo da criação
    const codeBlocks = document.querySelectorAll('.code-block');
    
    // CORREÇÃO: Mapear baseado no número visual do passo no HTML, não pelo índice do array
    codeBlocks.forEach((block) => {
        const stepCard = block.closest('.step-card');
        if (stepCard) {
            const stepNumber = stepCard.querySelector('.step-number');
            if (stepNumber) {
                const stepId = stepNumber.textContent.trim();
                block.setAttribute('data-step', stepId);
            }
        }
    });
}

function markCodeAsCopied(codeId) {
    const codeBlock = document.querySelector(`[data-code-id="${codeId}"]`);
    if (!codeBlock) return false;
    
    const stepId = codeBlock.getAttribute('data-step');
    if (!stepId) return false;
    
    // Verificar se o passo já foi copiado
    // Usar variável de sessão em vez de localStorage
    const copiedSteps = window.zyoSessionSteps;
    
    if (!copiedSteps[stepId]) {
        // Primeira vez copiando este passo
        copiedSteps[stepId] = {
            firstCopied: new Date().toISOString(),
            lastCopied: new Date().toISOString(),
            count: 1
        };
        
        // Atualizar progresso
        updateProgressBar();
        updateStepCounters();
        
        return true;
    } else {
        // Já foi copiado antes, apenas atualiza
        copiedSteps[stepId].lastCopied = new Date().toISOString();
        copiedSteps[stepId].count += 1;
        return false;
    }
}

function loadProgress() {
    // Função desativada para garantir que o progresso comece do zero
    const copiedSteps = window.zyoSessionSteps || {};
    
    // Atualizar visual dos blocos de código copiados
    Object.keys(copiedSteps).forEach(stepId => {
        const codeBlock = document.querySelector(`[data-step="${stepId}"]`);
        if (codeBlock) {
            const copyButton = codeBlock.querySelector('.btn-copy');
            if (copyButton) {
                copyButton.innerHTML = '<i class="fas fa-check"></i> <span>Copiado!</span>';
                copyButton.classList.add('copied');
                
                // Marcar card como completo visualmente
                const stepCard = codeBlock.closest('.step-card');
                if (stepCard) {
                    stepCard.classList.add('step-completed');
                }
                
                // Adicionar contador de vezes copiadas
                const count = copiedSteps[stepId].count;
                if (count > 1) {
                    const countBadge = document.createElement('span');
                    countBadge.className = 'copy-count';
                    countBadge.textContent = `×${count}`;
                    countBadge.style.cssText = `
                        margin-left: 8px;
                        background: rgba(255,255,255,0.2);
                        padding: 2px 6px;
                        border-radius: 10px;
                        font-size: 11px;
                    `;
                    copyButton.appendChild(countBadge);
                }
            }
        }
    });
}

function updateProgressBar() {
    // Contar apenas passos essenciais (exclui GNOME, XFCE, Personalização)
    const allStepCards = document.querySelectorAll('.step-card');
    let totalSteps = 0;
    
    allStepCards.forEach(card => {
        const stepNum = card.querySelector('.step-number');
        if (stepNum) {
            const id = stepNum.textContent.trim();
            if (isEssentialStep(id)) {
                totalSteps++;
            }
        }
    });

    const copiedSteps = window.zyoSessionSteps || {};
    const completedSteps = Object.keys(copiedSteps).filter(id => isEssentialStep(id)).length;
    
    const percentage = totalSteps > 0 
        ? Math.round((completedSteps / totalSteps) * 100) 
        : 0;
    
    // Atualizar barra de progresso
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    
    if (progressFill) {
        // Animação suave da barra
        progressFill.style.transition = 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        progressFill.style.width = `${percentage}%`;
    }
    
    if (progressPercent) {
        // Animação do número
        const currentPercent = parseInt(progressPercent.textContent) || 0;
        animateNumber(currentPercent, percentage, progressPercent);
    }
    
    // Atualizar contadores
    updateStepCounters(completedSteps, totalSteps);
    
    // Verificar se completou tudo
    if (completedSteps === totalSteps) {
        celebrateCompletion();
    }
}

function animateNumber(from, to, element) {
    const duration = 800;
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(from + (to - from) * easeOutQuart);
        
        element.textContent = `${currentValue}%`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = `${to}%`;
        }
    }
    
    requestAnimationFrame(update);
}

function updateStepCounters(completed = null, total = null) {
    if (completed === null || total === null) {
        const allStepCards = document.querySelectorAll('.step-card');
        let totalSteps = 0;
        allStepCards.forEach(card => {
            const stepNum = card.querySelector('.step-number');
            if (stepNum && isEssentialStep(stepNum.textContent.trim())) {
                totalSteps++;
            }
        });
        
        const copiedSteps = window.zyoSessionSteps || {};
        completed = Object.keys(copiedSteps).filter(id => isEssentialStep(id)).length;
        total = totalSteps;
    }
    
    const completedStepsElement = document.getElementById('completedSteps');
    const totalStepsElement = document.getElementById('totalSteps');
    
    if (completedStepsElement) {
        completedStepsElement.textContent = completed;
    }
    
    if (totalStepsElement) {
        totalStepsElement.textContent = total;
    }
}

function isEssentialStep(stepId) {
    if (!stepId) return false;
    // Excluir GNOME (5.x), XFCE (6.x) e Personalização (9.x) do progresso
    return !stepId.startsWith('5.') && !stepId.startsWith('6.') && !stepId.startsWith('9.');
}

function celebrateCompletion() {
    // Adicionar efeitos de celebração
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Adicionar confete visual
    const confetti = document.createElement('div');
    confetti.className = 'confetti-overlay';
    confetti.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 1000;
        overflow: hidden;
    `;
    
    // Criar partículas de confete
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${getRandomColor()};
            border-radius: 2px;
            top: -20px;
            left: ${Math.random() * 100}%;
            animation: fall ${1 + Math.random() * 2}s linear forwards;
            animation-delay: ${Math.random() * 1}s;
        `;
        confetti.appendChild(particle);
    }
    
    // Adicionar estilos de animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            to {
                transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                opacity: 0;
            }
        }
        
        .completion-celebration {
            animation: pulse 2s ease infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);
    
    sidebar.appendChild(confetti);
    
    // Notificação especial
    setTimeout(() => {
        showNotification('🎉 Parabéns! Você completou todos os passos da criação da sua distribuição!', 'success', 8000);
    }, 1000);
    
    // Remover confete após 3 segundos
    setTimeout(() => {
        confetti.remove();
    }, 3000);
}

function getRandomColor() {
    const colors = [
        '#15a6f0', '#2ac88d', '#f0b429', '#fa4444', 
        '#9b59b6', '#1abc9c', '#e74c3c', '#3498db'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/* ===================================
   MÓDULO DE SCROLL SUAVE
   =================================== */

function initializeSmoothScroll() {
    // Links internos com hash
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                scrollToSection(target);
            }
        });
    });
    
    // Configurar offset do scroll
    const style = document.createElement('style');
    style.textContent = `
        :target {
            scroll-margin-top: 120px;
        }
        
        @media (max-width: 768px) {
            :target {
                scroll-margin-top: 80px;
            }
        }
    `;
    document.head.appendChild(style);
}

/* ===================================
   MÓDULO RESPONSIVO
   =================================== */

function initializeResponsiveMenu() {
    const sidebar = document.querySelector('.sidebar');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!sidebar || !navMenu) return;
    
    // Botão de toggle para mobile
    const toggleButton = document.createElement('button');
    toggleButton.className = 'menu-toggle';
    toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
    toggleButton.setAttribute('aria-label', 'Alternar menu');
    toggleButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001; /* Garantir que fique acima da sidebar */
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 20px;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-lg);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toggleButton);
    
    // Verificar tamanho da tela
    function checkResponsive() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // No mobile, o CSS já esconde a sidebar por padrão
            toggleButton.style.display = 'flex';
        } else {
            sidebar.classList.remove('mobile-open');
            toggleButton.style.display = 'none';
        }
    }
    
    // Toggle do menu mobile
    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Impedir que o clique propague para o document
        sidebar.classList.toggle('mobile-open');
        const isOpen = sidebar.classList.contains('mobile-open');
        toggleButton.innerHTML = isOpen 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
        
        // Animação do botão
        toggleButton.style.transform = 'rotate(90deg)';
        setTimeout(() => {
            toggleButton.style.transform = 'rotate(0deg)';
        }, 300);
    });
    
    // Fechar menu ao clicar fora (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth > 768) return;
        
        // Se o menu não estiver aberto, ignora
        if (!sidebar.classList.contains('mobile-open')) return;
        
        // Se clicou dentro da sidebar ou no botão, ignora
        if (sidebar.contains(e.target) || toggleButton.contains(e.target)) return;
        
        // Fecha o menu
        sidebar.classList.remove('mobile-open');
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
    });
    
    // Inicializar e adicionar listener de resize
    checkResponsive();
    window.addEventListener('resize', checkResponsive);
}

/* ===================================
   MÓDULO DE OBSERVAÇÃO DE SEÇÕES
   =================================== */

function initializeSectionObserver() {
    const sections = document.querySelectorAll('.content-section');
    
    if (sections.length === 0) return;
    
    const observerOptions = {
        root: null,
        rootMargin: '-100px 0px -100px 0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
                
                // Atualizar navegação
                const sectionId = entry.target.id;
                const navItem = document.querySelector(`.nav-item[href="#${sectionId}"]`);
                
                if (navItem) {
                    document.querySelectorAll('.nav-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    navItem.classList.add('active');
                }
                
                // Marcar seção como visitada
                localStorage.setItem(`zyo-section-${sectionId}`, 'visited');
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

/* ===================================
   MÓDULO DE AÇÕES RÁPIDAS
   =================================== */

function initializeQuickActions() {
    // Botão para voltar ao topo
    const backToTopButton = document.createElement('button');
    backToTopButton.className = 'back-to-top';
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.setAttribute('aria-label', 'Voltar ao topo');
    backToTopButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-lg);
        z-index: 999;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
    `;
    
    document.body.appendChild(backToTopButton);
    
    // Mostrar/ocultar botão baseado no scroll
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            backToTopButton.style.display = 'flex';
            setTimeout(() => {
                backToTopButton.style.opacity = '1';
                backToTopButton.style.transform = 'translateY(0)';
            }, 10);
        } else {
            backToTopButton.style.opacity = '0';
            backToTopButton.style.transform = 'translateY(20px)';
            setTimeout(() => {
                backToTopButton.style.display = 'none';
            }, 300);
        }
    });
    
    // Funcionalidade do botão
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Feedback visual
        backToTopButton.style.transform = 'scale(0.9)';
        setTimeout(() => {
            backToTopButton.style.transform = 'scale(1)';
        }, 200);
    });
    
    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl + C para copiar código ativo
        if (e.ctrlKey && e.key === 'c') {
            const activeCodeBlock = document.querySelector('.code-block:hover .btn-copy');
            if (activeCodeBlock) {
                e.preventDefault();
                copyCodeWithProgress(activeCodeBlock);
            }
        }
        
        // Ctrl + P para ver progresso
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            showProgressSummary();
        }
        
        // Escape para fechar notificações
        if (e.key === 'Escape') {
            clearNotifications();
        }
    });
    
    // Função para mostrar resumo de progresso
    window.showProgressSummary = function() {
        const allStepCards = document.querySelectorAll('.step-card');
        let totalSteps = 0;
        allStepCards.forEach(card => {
            const stepNum = card.querySelector('.step-number');
            if (stepNum && isEssentialStep(stepNum.textContent.trim())) {
                totalSteps++;
            }
        });
        
        const copiedSteps = window.zyoSessionSteps || {};
        const completedSteps = Object.keys(copiedSteps).filter(id => isEssentialStep(id)).length;
        const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        
        const summary = `
            <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 15px; color: var(--primary);">📊 Resumo do Progresso</h3>
                <div style="font-size: 48px; font-weight: bold; color: var(--primary); margin: 20px 0;">
                    ${percentage}%
                </div>
                <p style="color: var(--text-muted); margin-bottom: 20px;">
                    ${completedSteps} de ${totalSteps} passos concluídos
                </p>
                <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                    <button onclick="ZYO.exportProgress()" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Exportar Progresso
                    </button>
                    <button onclick="ZYO.resetProgress()" style="padding: 10px 20px; background: var(--warning); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Resetar Progresso
                    </button>
                </div>
            </div>
        `;
        
        showNotification(summary, 'info', 10000);
    };
}

/* ===================================
   MÓDULO DE NOTIFICAÇÕES
   =================================== */

function initializeNotifications() {
    // Criar container de notificações
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
    `;
    
    document.body.appendChild(notificationContainer);
}

function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    
    // Verificar se é HTML
    const isHTML = message.includes('<');
    
    // Ícone baseado no tipo
    let icon = 'info-circle';
    switch(type) {
        case 'success': icon = 'check-circle'; break;
        case 'warning': icon = 'exclamation-triangle'; break;
        case 'error': icon = 'times-circle'; break;
        default: icon = 'info-circle';
    }
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-content">
            ${isHTML ? message : `<p>${message}</p>`}
        </div>
        <button class="notification-close" aria-label="Fechar">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Estilos dinâmicos
    const typeStyles = {
        info: { background: 'var(--primary)', color: 'white' },
        success: { background: 'var(--success)', color: 'white' },
        warning: { background: 'var(--warning)', color: 'white' },
        error: { background: 'var(--danger)', color: 'white' }
    };
    
    const styles = typeStyles[type] || typeStyles.info;
    
    notification.style.cssText = `
        background: ${styles.background};
        color: ${styles.color};
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 15px;
        animation: slideInRight 0.3s ease;
        transform: translateX(0);
        opacity: 1;
        transition: all 0.3s ease;
        max-width: 400px;
    `;
    
    // Estilos internos
    notification.querySelector('.notification-icon').style.cssText = `
        font-size: 20px;
        flex-shrink: 0;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        min-width: 0;
    `;
    
    notification.querySelector('.notification-content p').style.cssText = `
        margin: 0;
        word-wrap: break-word;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: transparent;
        border: none;
        color: inherit;
        font-size: 16px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.2s;
        flex-shrink: 0;
    `;
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        dismissNotification(notification);
    });
    
    // Adicionar ao container
    container.appendChild(notification);
    
    // Auto-dismiss
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                dismissNotification(notification);
            }
        }, duration);
    }
    
    // Animação CSS
    const animationStyle = document.createElement('style');
    if (!document.querySelector('#notification-animations')) {
        animationStyle.id = 'notification-animations';
        animationStyle.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(animationStyle);
    }
    
    return notification;
}

function dismissNotification(notification) {
    notification.style.animation = 'slideOutRight 0.3s ease';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function clearNotifications() {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notifications = container.querySelectorAll('.notification');
    notifications.forEach(notification => {
        dismissNotification(notification);
    });
}

/* ===================================
   ANIMAÇÕES DE ENTRADA
   =================================== */

function animateElementsOnLoad() {
    // Animar seções
    document.querySelectorAll('.content-section').forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
    
    // Animar cards
    setTimeout(() => {
        document.querySelectorAll('.step-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-20px)';
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateX(0)';
            }, index * 50);
        });
    }, 500);
}

/* ===================================
   FUNÇÕES UTILITÁRIAS GLOBAIS
   =================================== */

// Exportar funções globais
window.ZYO = {
    // Navegação
    goToSection,
    
    // Código
    copyCode: copyCodeWithProgress,
    copyToClipboard,
    
    // Progresso
    saveAllProgress: function() {
        showNotification('O progresso é salvo automaticamente nesta sessão.', 'info');
    },
    
    resetProgress: function() {
        if (confirm('Tem certeza que deseja resetar todo o progresso? Isso não pode ser desfeito.')) {
            window.zyoSessionSteps = {};
            updateProgressBar();
            
            // Resetar botões de cópia
            document.querySelectorAll('.btn-copy').forEach(button => {
                button.innerHTML = '<i class="far fa-copy"></i> <span>Copiar</span>';
                button.classList.remove('copied');
            });
            
            showNotification('Progresso resetado com sucesso!', 'success');
        }
    },
    
    // Exportar dados
    exportProgress: function() {
        const copiedSteps = window.zyoSessionSteps || {};
        
        // Gerar lista de passos dinamicamente do DOM para exportação correta
        const allSteps = Array.from(document.querySelectorAll('.step-card')).map(card => {
            const num = card.querySelector('.step-number');
            return num ? num.textContent.trim() : null;
        }).filter(id => id !== null && isEssentialStep(id));

        const totalSteps = allSteps.length;
        const completedSteps = Object.keys(copiedSteps).filter(id => isEssentialStep(id)).length;
        const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        
        const data = {
            timestamp: new Date().toISOString(),
            project: 'ZYO-OS From Scratch',
            totalSteps: totalSteps,
            completedSteps: completedSteps,
            progressPercentage: percentage,
            steps: allSteps.map(stepId => ({
                step: stepId,
                completed: !!copiedSteps[stepId],
                firstCopied: copiedSteps[stepId]?.firstCopied || null,
                timesCopied: copiedSteps[stepId]?.count || 0
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zyo-os-progress-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Progresso exportado com sucesso!', 'success');
    },
    
    // Notificações
    showNotification,
    clearNotifications,
    
    // Resumo
    showProgressSummary: window.showProgressSummary
};

/* ===================================
   SELETOR DE LOCALIZAÇÃO E TECLADO
   =================================== */

function generateLocaleCommand() {
    const localeSelect = document.getElementById('localeSelect');
    const keyboardSelect = document.getElementById('keyboardSelect');
    const resultDiv = document.getElementById('localeCommandResult');
    const commandDiv = document.getElementById('generatedCommand');
    
    if (!localeSelect.value || !keyboardSelect.value) {
        showNotification('Por favor, selecione uma localização e um layout de teclado', 'warning');
        return;
    }
    
    // Parse do locale selecionado (formato: locale|timezone|keyboard)
    const [locale, timezone] = localeSelect.value.split('|');
    const keyboard = keyboardSelect.value;
    
    // Gerar comando personalizado
    const command = `apt install -y locales keyboard-configuration && echo '${locale} UTF-8' > /etc/locale.gen && locale-gen && update-locale LANG=${locale} && echo 'KEYMAP=${keyboard}' > /etc/default/keyboard && ln -sf /usr/share/zoneinfo/${timezone} /etc/localtime`;
    
    // Mostrar resultado
    commandDiv.textContent = command;
    resultDiv.style.display = 'block';
    
    // Feedback visual
    showNotification('✨ Comando personalizado gerado com sucesso!', 'success');
}

function copyGeneratedCommand() {
    const commandDiv = document.getElementById('generatedCommand');
    const command = commandDiv.textContent;
    
    if (!command) {
        showNotification('Nenhum comando foi gerado ainda', 'warning');
        return;
    }
    
    copyToClipboard(command).then(() => {
        showNotification('Comando copiado para área de transferência!', 'success');
        
        // Marcar passo 2.7 como concluído (Progresso)
        const stepId = '2.7';
        if (window.zyoSessionSteps && !window.zyoSessionSteps[stepId]) {
            window.zyoSessionSteps[stepId] = {
                firstCopied: new Date().toISOString(),
                lastCopied: new Date().toISOString(),
                count: 1
            };
            updateProgressBar();
        }
        
        // Feedback visual no card (Borda verde e check)
        const resultContainer = document.getElementById('localeCommandResult');
        if (resultContainer) {
            const stepCard = resultContainer.closest('.step-card');
            if (stepCard) stepCard.classList.add('step-completed');
        }
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        showNotification('Erro ao copiar o comando', 'error');
    });
}

/* ===================================
   SELETOR DE APLICATIVOS
   =================================== */

function generateAppsCommand() {
    const resultDiv = document.getElementById('appsCommandResult');
    const commandDiv = document.getElementById('generatedAppsCommand');
    
    // Obter todos os checkboxes marcados
    const selectedApps = Array.from(document.querySelectorAll('.app-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedApps.length === 0) {
        showNotification('Por favor, selecione pelo menos um aplicativo', 'warning');
        return;
    }
    
    // Gerar comando de instalação
    const command = `apt install -y ${selectedApps.join(' ')}`;
    
    // Mostrar resultado
    commandDiv.textContent = command;
    resultDiv.style.display = 'block';
    
    // Mostrar resumo dos aplicativos selecionados
    const essentials = selectedApps.filter(app => ['firefox-esr', 'curl', 'wget', 'git', 'vim', 'nano', 'htop'].includes(app));
    const optional = selectedApps.filter(app => !['firefox-esr', 'curl', 'wget', 'git', 'vim', 'nano', 'htop'].includes(app));
    
    let summary = `✨ Comando personalizado gerado!\n\n📦 Total de aplicativos: ${selectedApps.length}`;
    if (essentials.length > 0) summary += `\n⭐ Essenciais: ${essentials.length}`;
    if (optional.length > 0) summary += `\n✅ Opcionais: ${optional.length}`;
    
    showNotification(summary, 'success');
}

function copyAppsCommand() {
    const commandDiv = document.getElementById('generatedAppsCommand');
    const command = commandDiv.textContent;
    
    if (!command) {
        showNotification('Nenhum comando foi gerado ainda', 'warning');
        return;
    }
    
    copyToClipboard(command).then(() => {
        showNotification('Comando de aplicativos copiado para área de transferência!', 'success');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        showNotification('Erro ao copiar o comando', 'error');
    });
}

// Tornar funções disponíveis globalmente
window.generateLocaleCommand = generateLocaleCommand;
window.copyGeneratedCommand = copyGeneratedCommand;
window.generateAppsCommand = generateAppsCommand;
window.copyAppsCommand = copyAppsCommand;

/* ===================================
   DETECÇÃO DE RECURSOS
   =================================== */

// Verificar suporte a localStorage
if (typeof localStorage === 'undefined') {
    console.warn('localStorage não está disponível. O progresso não será salvo.');
    showNotification('Seu navegador não suporta salvamento local. O progresso não será salvo entre sessões.', 'warning');
}

// Verificar suporte a Clipboard API
if (!navigator.clipboard && !document.queryCommandSupported('copy')) {
    console.warn('Clipboard API não suportada. A cópia de código pode não funcionar.');
}

/* ===================================
   INICIALIZAÇÃO FINAL
   =================================== */

// Adicionar informações de debug no console
console.log('%cZYO-OS Documentation %cv1.0.0', 
    'color: #15a6f0; font-weight: bold; font-size: 16px;',
    'color: #64748b; font-size: 12px;');
console.log('%c✨ Funcionalidades carregadas:', 'color: #2ac88d;');
console.log('- Navegação suave');
console.log('- Cópia de código automática com &&');
console.log('- Sistema de progresso por cópia de código');
console.log('- Sistema de notificações');
console.log('- Interface responsiva');

// Verificar se há um hash na URL para navegação inicial
if (window.location.hash) {
    setTimeout(() => {
        const sectionId = window.location.hash.substring(1);
        goToSection(sectionId);
    }, 500);
}
