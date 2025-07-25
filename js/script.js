// Garante que o script só seja executado após o DOM estar completamente carregado.
document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de elementos HTML ---
    // Através do `getElementById`, obtém referências para elementos chave do formulário de adição de tarefas.
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskPriorityInput = document.getElementById('taskPriority');
    const taskDueDateInput = document.getElementById('taskDueDate');
    const taskImagesInput = document.getElementById('taskImages'); // Campo para múltiplos arquivos de imagem
    const imagePreviewContainer = document.getElementById('imagePreviewContainer'); // Contêiner para pré-visualização de imagens
    const addTaskBtn = document.getElementById('addTaskBtn'); // Botão para adicionar/salvar tarefa
    const taskList = document.getElementById('taskList'); // Lista onde as tarefas são exibidas
    const taskListSection = document.getElementById('taskListSection'); // Seção que contém a lista de tarefas

    // Seletores para os botões de importação/exportação.
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile'); // Input de arquivo para importação
    const importBtn = document.getElementById('importBtn');

    // Seletores para elementos relacionados às subtarefas.
    const addSubtaskBtn = document.getElementById('addSubtaskBtn'); // Botão para adicionar subtarefa
    const subtaskInput = document.getElementById('subtaskInput'); // Input para o nome da subtarefa
    const subtaskListContainer = document.getElementById('subtaskList'); // Contêiner da lista de subtarefas temporárias

    // Seletor para o contêiner de notificações.
    const notificationContainer = document.getElementById('notificationContainer');

    // Seletores para os filtros e ordenação da lista de tarefas.
    const filterStatusSelect = document.getElementById('filterStatus');
    const sortBySelect = document.getElementById('sortBy');
    const filterPrioritySelect = document.getElementById('filterPriority');

    // Seletor para o campo de busca.
    const searchInput = document.getElementById('searchInput');

    // Seletor para o checkbox de ocultar/exibir imagens.
    const toggleImagesCheckbox = document.getElementById('toggleImages');

    // Seletores para as mensagens de erro de validação.
    const taskTitleError = document.getElementById('taskTitleError');
    const taskDescriptionError = document.getElementById('taskDescriptionError');
    const subtaskInputError = document.getElementById('subtaskInputError');

    // Seletores para o modal de confirmação de exclusão.
    const confirmationModal = document.getElementById('confirmationModal');
    confirmationModal.style.display = 'none'; // Garante que o modal esteja oculto ao carregar a página
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const closeButton = document.querySelector('.close-button'); // Botão 'x' do modal

    // --- Variáveis de estado globais ---
    let currentSubtasks = []; // Armazena subtarefas temporárias antes de adicionar a tarefa principal
    let editingTaskId = null; // Armazena o ID da tarefa que está sendo editada (null se não estiver editando)
    let currentImagesBase64 = []; // Armazena as imagens em formato Base64 para a tarefa atual
    let taskIdToDeleteConfirmed = null; // Armazena o ID da tarefa a ser excluída após a confirmação do modal

    // --- FUNÇÕES AUXILIARES ---

    /**
     * Exibe uma notificação na tela.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - O tipo da notificação ('success', 'error', 'info').
     */
    function showNotification(message, type) {
        // Cria um novo elemento div para a notificação.
        const notification = document.createElement('div');
        // Adiciona classes CSS para estilização e tipo da notificação.
        notification.classList.add('notification', type);

        let iconClass = '';
        // Define o ícone com base no tipo de notificação.
        if (type === 'success') {
            iconClass = 'fas fa-check-circle';
        } else if (type === 'error') {
            iconClass = 'fas fa-exclamation-triangle';
        } else if (type === 'info') {
            iconClass = 'fas fa-info-circle';
        }

        // Define o conteúdo HTML da notificação, incluindo o ícone e a mensagem.
        notification.innerHTML = `<i class="${iconClass}"></i> ${message}`;
        // Adiciona a notificação ao contêiner de notificações no DOM.
        notificationContainer.appendChild(notification);

        // Define um temporizador para remover a notificação após 3.5 segundos.
        setTimeout(() => {
            notification.remove();
        }, 3500);
    }

    /**
     * Exibe uma mensagem de erro abaixo de um campo do formulário.
     * @param {HTMLElement} inputElement - O elemento input/textarea associado ao erro.
     * @param {HTMLElement} errorElement - O elemento span onde a mensagem de erro será exibida.
     * @param {string} message - A mensagem de erro a ser exibida.
     */
    function displayError(inputElement, errorElement, message) {
        // Adiciona a classe CSS 'input-error' ao campo para destacá-lo (borda vermelha, etc.).
        inputElement.classList.add('input-error');
        // Define o texto da mensagem de erro no elemento span.
        errorElement.textContent = message;
    }

    /**
     * Limpa a mensagem de erro e remove o estilo de erro de um campo.
     * @param {HTMLElement} inputElement - O elemento input/textarea associado ao erro.
     * @param {HTMLElement} errorElement - O elemento span onde a mensagem de erro foi exibida.
     */
    function clearError(inputElement, errorElement) {
        // Remove a classe CSS 'input-error' do campo.
        inputElement.classList.remove('input-error');
        // Limpa o texto da mensagem de erro.
        errorElement.textContent = '';
    }

    // Função para lidar com o upload de MÚLTIPLAS imagens e exibir preview.
    function handleImageUpload(event) {
        // Obtém os arquivos selecionados e limita a um máximo de 5.
        const files = Array.from(event.target.files).slice(0, 5);
        currentImagesBase64 = []; // Zera o array de imagens ao fazer um novo upload.
        imagePreviewContainer.innerHTML = ''; // Limpa previews anteriores.

        // Exibe ou oculta o contêiner de pré-visualização com base na existência de arquivos.
        if (files.length > 0) {
            imagePreviewContainer.style.display = 'flex';
        } else {
            imagePreviewContainer.style.display = 'none';
        }

        // Itera sobre cada arquivo para criar o preview.
        files.forEach((file, index) => {
            const reader = new FileReader(); // Cria um novo FileReader para ler o conteúdo do arquivo.
            reader.onload = (e) => {
                // Cria um contêiner para cada imagem de preview.
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('image-preview-item');

                // Cria o elemento <img> e define sua origem (src) como o resultado da leitura do arquivo (Base64).
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = `Preview da Imagem ${index + 1}`;

                // Cria o botão de remover imagem do preview.
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.classList.add('remove-image-preview-btn');
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                // Armazena o índice da imagem no dataset do botão para fácil remoção.
                removeBtn.dataset.index = currentImagesBase64.length;
                // Adiciona um listener para a função de remover imagem.
                removeBtn.addEventListener('click', removeImagePreview);

                // Adiciona a imagem e o botão ao contêiner da imagem.
                imgContainer.appendChild(img);
                imgContainer.appendChild(removeBtn);
                // Adiciona o contêiner da imagem ao contêiner principal de previews.
                imagePreviewContainer.appendChild(imgContainer);
                // Adiciona a imagem em Base64 ao array principal.
                currentImagesBase64.push(e.target.result);
            };
            // Lê o conteúdo do arquivo como uma URL de dados (Base64).
            reader.readAsDataURL(file);
        });
    }

    // Função para remover uma imagem do preview.
    function removeImagePreview(event) {
        // Obtém o botão que foi clicado.
        const clickedButton = event.currentTarget;
        // Encontra o índice da imagem a ser removida no array `currentImagesBase64`.
        const indexToRemove = Array.from(imagePreviewContainer.children).indexOf(clickedButton.parentNode);

        if (indexToRemove > -1) {
            // Remove a imagem do array de Base64.
            currentImagesBase64.splice(indexToRemove, 1);
            // Remove o elemento HTML do preview.
            clickedButton.parentNode.remove();

            // Se não houver mais imagens, oculta o contêiner de preview e limpa o input de arquivo.
            if (currentImagesBase64.length === 0) {
                imagePreviewContainer.style.display = 'none';
                taskImagesInput.value = '';
            }
            
            // Reajusta os `data-index` dos botões de remoção restantes para manter a consistência.
            Array.from(imagePreviewContainer.children).forEach((item, idx) => {
                const btn = item.querySelector('.remove-image-preview-btn');
                if (btn) btn.dataset.index = idx;
            });
            showNotification('Imagem removida.', 'success'); // Exibe notificação de sucesso.
        }
    }

    // Função para limpar TODO o preview de imagem.
    function clearImagePreview() {
        imagePreviewContainer.innerHTML = ''; // Limpa o HTML interno do contêiner.
        imagePreviewContainer.style.display = 'none'; // Oculta o contêiner.
        currentImagesBase64 = []; // Limpa o array de imagens.
        if (taskImagesInput) { // Verifica se o elemento do input de arquivo existe.
            taskImagesInput.value = ''; // Limpa o valor do input de arquivo.
        }
    }

    // Função auxiliar para salvar o array de tarefas no LocalStorage.
    function saveTasks(tasks) {
        try {
            // Converte o array de tarefas para uma string JSON e salva no LocalStorage.
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (e) {
            console.error("Erro ao salvar tarefas no localStorage:", e);
            showNotification('Erro ao salvar dados!', 'error');
        }
    }

    // Função auxiliar para obter o array de tarefas do LocalStorage.
    function getTasks() {
        try {
            // Tenta obter a string de tarefas do LocalStorage.
            const tasksString = localStorage.getItem('tasks');
            // Se existir, parseia a string JSON para um array, caso contrário, retorna um array vazio.
            return tasksString ? JSON.parse(tasksString) : [];
        } catch (e) {
            console.error("Erro ao carregar tarefas do localStorage. Dados podem estar corrompidos.", e);
            localStorage.removeItem('tasks'); // Remove dados corrompidos.
            showNotification('Erro ao carregar dados salvos. Dados antigos foram removidos.', 'error');
            return [];
        }
    }

    // Função para calcular a porcentagem de conclusão de uma tarefa.
    function calculateCompletionPercentage(task) {
        // Se não houver subtarefas, a porcentagem é 0.
        if (!task.subtasks || task.subtasks.length === 0) {
            return 0;
        }
        // Conta quantas subtarefas estão marcadas como concluídas.
        const completedSubtasks = task.subtasks.filter(sub => sub.completed).length;
        // Calcula a porcentagem.
        return (completedSubtasks / task.subtasks.length) * 100;
    }

    // Função para renderizar as subtarefas temporárias (na seção "Adicionar Tarefa").
    function renderCurrentSubtasks() {
        subtaskListContainer.innerHTML = ''; // Limpa a lista existente de subtarefas.
        if (currentSubtasks.length === 0) {
            // Exibe mensagem se não houver subtarefas.
            subtaskListContainer.innerHTML = '<p class="no-subtasks-message">Nenhuma subtarefa adicionada.</p>';
        } else {
            // Itera sobre as subtarefas e cria os elementos HTML.
            currentSubtasks.forEach((subtask, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${subtask.name}</span>
                    <button type="button" class="remove-subtask-btn" data-index="${index}">
                        <i class="fas fa-times-circle"></i> Remover
                    </button>
                `;
                // Adiciona listener para o botão de remover subtarefa.
                li.querySelector('.remove-subtask-btn').addEventListener('click', function() {
                    const indexToRemove = parseInt(this.dataset.index);
                    currentSubtasks.splice(indexToRemove, 1); // Remove a subtarefa do array.
                    renderCurrentSubtasks(); // Re-renderiza a lista de subtarefas.
                    showNotification('Subtarefa removida.', 'success');
                });
                subtaskListContainer.appendChild(li); // Adiciona o item da lista ao contêiner.
            });
        }
    }

    // Função para limpar o formulário e reverter para o modo "Adicionar Tarefa".
    function clearForm() {
        taskTitleInput.value = ''; // Limpa o campo do título.
        taskDescriptionInput.value = ''; // Limpa o campo da descrição.
        taskPriorityInput.value = 'medium'; // Volta a prioridade para o padrão.
        taskDueDateInput.value = ''; // Limpa a data de vencimento.
        clearImagePreview(); // Limpa o preview e o array de imagens.
        currentSubtasks = []; // Limpa as subtarefas temporárias.
        renderCurrentSubtasks(); // Re-renderiza as subtarefas.
        editingTaskId = null; // Reseta o ID da tarefa em edição.
        addTaskBtn.innerHTML = '<i class="fas fa-check-circle"></i> Adicionar Tarefa'; // Altera o texto do botão.
        addTaskBtn.classList.remove('save-changes-btn'); // Remove a classe de estilo de "salvar alterações".

        // Limpa as mensagens de erro ao limpar o formulário.
        clearError(taskTitleInput, taskTitleError);
        clearError(taskDescriptionInput, taskDescriptionError);
        clearError(subtaskInput, subtaskInputError);
    }

    // Função para preencher o formulário para edição de tarefa.
    function populateFormForEdit(task) {
        taskTitleInput.value = task.title; // Preenche o título.
        taskDescriptionInput.value = task.description; // Preenche a descrição.
        taskPriorityInput.value = task.priority || 'medium'; // Preenche a prioridade (com padrão se não existir).
        taskDueDateInput.value = task.dueDate || ''; // Preenche a data de vencimento.

        imagePreviewContainer.innerHTML = ''; // Limpa qualquer preview existente.
        currentImagesBase64 = task.imageUrls ? [...task.imageUrls] : []; // Carrega as URLs das imagens da tarefa.

        if (currentImagesBase64.length > 0) {
            imagePreviewContainer.style.display = 'flex'; // Garante que o contêiner esteja visível.
            // Itera sobre as URLs das imagens e cria os previews.
            currentImagesBase64.forEach((url, index) => {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('image-preview-item');

                const img = document.createElement('img');
                img.src = url;
                img.alt = `Imagem da Tarefa ${index + 1}`;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.classList.add('remove-image-preview-btn');
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.dataset.index = index; // Armazena o índice original da imagem.
                removeBtn.addEventListener('click', removeImagePreview);

                imgContainer.appendChild(img);
                imgContainer.appendChild(removeBtn);
                imagePreviewContainer.appendChild(imgContainer);
            });
        } else {
            clearImagePreview(); // Oculta e limpa se não houver imagens.
        }

        currentSubtasks = task.subtasks ? [...task.subtasks] : []; // Carrega as subtarefas da tarefa.
        renderCurrentSubtasks(); // Renderiza as subtarefas no formulário.
        editingTaskId = task.id; // Define o ID da tarefa em edição.
        addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações'; // Altera o texto do botão para "Salvar".
        addTaskBtn.classList.add('save-changes-btn'); // Adiciona classe de estilo para "salvar".
        showNotification('Modo de edição ativado!', 'info'); // Exibe notificação.
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo da página suavemente.

        // Limpa erros anteriores ao entrar no modo de edição.
        clearError(taskTitleInput, taskTitleError);
        clearError(taskDescriptionInput, taskDescriptionError);
        clearError(subtaskInput, subtaskInputError);
    }

    // Função para determinar o status da data de vencimento (vencida, vence hoje, vence em breve).
    function getDueDateStatus(dueDate) {
        if (!dueDate) return ''; // Se não houver data de vencimento, retorna vazio.

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data.

        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data.

        if (due < today) {
            return 'overdue'; // Vencida.
        } else if (due.getTime() === today.getTime()) {
            return 'due-today'; // Vence hoje.
        } else {
            const diffTime = Math.abs(due.getTime() - today.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Calcula a diferença em dias.
            if (diffDays <= 3) { // Vence em 3 dias ou menos.
                return 'due-soon';
            }
        }
        return ''; // Sem status especial.
    }

    // Função para aplicar filtro, busca e ordenação antes de renderizar a lista de tarefas.
    function applyFiltersAndSorting(tasks) {
        let filteredTasks = [...tasks]; // Cria uma cópia do array de tarefas para não modificar o original.
        const currentSearchQuery = searchInput.value.toLowerCase().trim(); // Obtém o termo de busca, em minúsculas e sem espaços extras.

        // 0. Aplica a busca (filtra por título ou descrição).
        if (currentSearchQuery) {
            filteredTasks = filteredTasks.filter(task =>
                task.title.toLowerCase().includes(currentSearchQuery) ||
                (task.description && task.description.toLowerCase().includes(currentSearchQuery))
            );
        }

        // 1. Aplica o filtro de status (pendente/completa).
        const filterStatus = filterStatusSelect.value;
        if (filterStatus === 'pending') {
            filteredTasks = filteredTasks.filter(task => calculateCompletionPercentage(task) < 100);
        } else if (filterStatus === 'completed') {
            filteredTasks = filteredTasks.filter(task => calculateCompletionPercentage(task) === 100 && task.subtasks.length > 0);
        }

        // 2. Aplica o filtro de prioridade.
        const filterPriority = filterPrioritySelect.value;
        if (filterPriority !== 'all') {
            filteredTasks = filteredTasks.filter(task => (task.priority || 'medium') === filterPriority);
        }

        // 3. Aplica a ordenação com base na opção selecionada.
        const sortBy = sortBySelect.value;
        filteredTasks.sort((a, b) => {
            if (sortBy === 'createdAt') {
                return new Date(a.createdAt) - new Date(b.createdAt); // Mais recentes primeiro
            } else if (sortBy === 'titleAsc') {
                return a.title.localeCompare(b.title); // Ordem alfabética A-Z
            } else if (sortBy === 'titleDesc') {
                return b.title.localeCompare(a.title); // Ordem alfabética Z-A
            } else if (sortBy === 'completionAsc') {
                return calculateCompletionPercentage(a) - calculateCompletionPercentage(b); // Conclusão crescente
            } else if (sortBy === 'completionDesc') {
                return calculateCompletionPercentage(b) - calculateCompletionPercentage(a); // Conclusão decrescente
            } else if (sortBy === 'dueDateAsc') {
                // Ordena por data de vencimento crescente, tratando datas nulas.
                const dateA = a.dueDate ? new Date(a.dueDate) : null;
                const dateB = b.dueDate ? new Date(b.dueDate) : null;
                if (dateA && dateB) {
                    return dateA - dateB;
                } else if (dateA) {
                    return -1; // A tem data, B não, então A vem antes
                } else if (dateB) {
                    return 1; // B tem data, A não, então B vem antes
                }
                return 0; // Ambos sem data
            } else if (sortBy === 'dueDateDesc') {
                // Ordena por data de vencimento decrescente, tratando datas nulas.
                const dateA = a.dueDate ? new Date(a.dueDate) : null;
                const dateB = b.dueDate ? new Date(b.dueDate) : null;
                if (dateA && dateB) {
                    return dateB - dateA;
                } else if (dateA) {
                    return 1; // A tem data, B não, então B vem antes
                } else if (dateB) {
                    return -1; // B tem data, A não, então A vem antes
                }
                return 0; // Ambos sem data
            }
            return 0; // Se não houver critério de ordenação específico, mantém a ordem original
        });
        return filteredTasks; // Retorna o array de tarefas filtradas e ordenadas.
    }

    // Função para formatar a data para exibição.
    function formatDate(dateString) {
        if (!dateString) return 'Não definida'; // Se a string de data for vazia, retorna "Não definida".
        // Cria um objeto Date, adicionando "T00:00:00" para evitar problemas de fuso horário.
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', options); // Formata a data para o local pt-BR.
    }

    // Função para renderizar a lista completa de tarefas (ATUALIZADA para exibir múltiplas imagens).
    function renderTaskList() {
        const allTasks = getTasks(); // Obtém todas as tarefas do LocalStorage.
        const tasksToDisplay = applyFiltersAndSorting(allTasks); // Aplica filtros, busca e ordenação.
        taskList.innerHTML = ''; // Limpa a lista de tarefas existente no DOM.

        if (tasksToDisplay.length === 0) {
            // Exibe mensagem se não houver tarefas para exibir.
            taskList.innerHTML = '<p class="no-tasks-message">Nenhuma tarefa encontrada com os filtros, busca e ordenação atuais.</p>';
            return;
        }

        // Itera sobre cada tarefa a ser exibida.
        tasksToDisplay.forEach(task => {
            const listItem = document.createElement('li'); // Cria um novo item de lista para a tarefa.
            listItem.classList.add('task-item'); // Adiciona a classe CSS 'task-item'.
            listItem.setAttribute('data-id', task.id); // Define um atributo 'data-id' com o ID da tarefa.

            const completionPercentage = calculateCompletionPercentage(task); // Calcula a porcentagem de conclusão.
            const isTaskComplete = completionPercentage === 100 && task.subtasks.length > 0; // Verifica se a tarefa está completa.
            if (isTaskComplete) {
                listItem.classList.add('task-complete'); // Adiciona classe se a tarefa estiver completa.
            } else {
                listItem.classList.remove('task-complete'); // Remove classe se não estiver.
            }

            // Adiciona classe de prioridade para estilização.
            listItem.classList.add(`priority-${task.priority || 'medium'}`);

            // Adiciona classe de status de vencimento (overdue, due-today, due-soon).
            const dueDateStatus = getDueDateStatus(task.dueDate);
            if (dueDateStatus) {
                listItem.classList.add(dueDateStatus);
            }

            // ATUALIZADO: Renderização de múltiplas imagens.
            let imagesHtml = '';
            if (task.imageUrls && task.imageUrls.length > 0) {
                // Mapeia cada URL de imagem para um elemento <img>.
                const imageElements = task.imageUrls.map(url => `
                    <img src="${url}" alt="Imagem da tarefa" class="task-image">
                `).join(''); // Concatena os elementos HTML das imagens.
                imagesHtml = `<div class="task-image-container multiple-images-display">${imageElements}</div>`;
            }

            // Cria o HTML para as subtarefas da tarefa.
            let subtasksHtml = '';
            if (task.subtasks && task.subtasks.length > 0) {
                subtasksHtml = `
                    <h4><i class="fas fa-tasks"></i> Subtarefas:</h4>
                    <ul class="subtasks-list">
                        ${task.subtasks.map((sub, subIndex) => `
                            <li data-task-id="${task.id}" data-subtask-index="${subIndex}" class="${sub.completed ? 'completed' : ''}">
                                <div>
                                    <input type="checkbox" id="subtask-${task.id}-${subIndex}" ${sub.completed ? 'checked' : ''}>
                                    <label for="subtask-${task.id}-${subIndex}">${sub.name}</label>
                                </div>
                                <div class="subtask-actions">
                                    <button type="button" class="edit-subtask-btn"><i class="fas fa-edit"></i></button>
                                    <button type="button" class="save-subtask-btn" style="display:none;"><i class="fas fa-save"></i></button>
                                    <button type="button" class="cancel-subtask-btn" style="display:none;"><i class="fas fa-times"></i></button>
                                    <button type="button" class="remove-subtask-btn"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                `;
            }

            // Constrói o HTML completo para o item da tarefa.
            listItem.innerHTML = `
                <div class="task-actions">
                    <button type="button" class="edit-btn" title="Editar Tarefa"><i class="fas fa-edit"></i></button>
                    <button type="button" class="delete-btn" title="Excluir Tarefa"><i class="fas fa-trash-alt"></i></button>
                    <button type="button" class="toggle-complete-btn" title="${isTaskComplete ? 'Reabrir Tarefa' : 'Concluir Tarefa'}">
                        <i class="fas ${isTaskComplete ? 'fa-undo-alt' : 'fa-check'}"></i>
                    </button>
                </div>
                <h3>${task.title}</h3>
                <p>${task.description ? task.description.replace(/\n/g, '<br>') : 'Sem descrição.'}</p>
                <div class="task-details">
                    <span><i class="fas fa-flag"></i> Prioridade: <span class="priority-label priority-${task.priority || 'medium'}">${(task.priority || 'medium').toUpperCase()}</span></span>
                    <span><i class="fas fa-calendar-alt"></i> Vencimento: ${formatDate(task.dueDate)}</span>
                    <span><i class="fas fa-clock"></i> Criado em: ${formatDate(task.createdAt)}</span>
                </div>
                ${subtasksHtml}
                ${task.subtasks && task.subtasks.length > 0 ? `
                    <div class="completion-bar-container">
                        <div class="completion-bar" style="width: ${completionPercentage}%;"></div>
                    </div>
                    <p class="completion-text">${completionPercentage.toFixed(0)}% Concluído</p>
                ` : ''}
                <div class="task-footer-actions">
                    ${imagesHtml}
                </div>
            `;
            taskList.appendChild(listItem); // Adiciona o item da tarefa à lista no DOM.

            // Adiciona listeners para os botões de ação da tarefa (editar, excluir, concluir/reabrir).
            listItem.querySelector('.edit-btn').addEventListener('click', () => populateFormForEdit(task));
            listItem.querySelector('.delete-btn').addEventListener('click', () => {
                taskIdToDeleteConfirmed = task.id; // Armazena o ID para confirmação.
                confirmationModal.style.display = 'flex'; // Exibe o modal de confirmação.
            });
            listItem.querySelector('.toggle-complete-btn').addEventListener('click', () => toggleTaskCompletion(task.id));

            // Adiciona listeners para os checkboxes e botões de subtarefas.
            if (task.subtasks && task.subtasks.length > 0) {
                listItem.querySelectorAll('.subtasks-list input[type="checkbox"]').forEach(checkbox => {
                    checkbox.addEventListener('change', (event) => toggleSubtaskCompletion(task.id, event.target.id.split('-')[2]));
                });

                listItem.querySelectorAll('.subtasks-list .remove-subtask-btn').forEach(button => {
                    button.addEventListener('click', (event) => removeSubtaskFromTask(task.id, event.currentTarget.parentNode.parentNode.dataset.subtaskIndex));
                });

                listItem.querySelectorAll('.subtasks-list .edit-subtask-btn').forEach(button => {
                    button.addEventListener('click', (event) => editSubtaskInTask(task.id, event.currentTarget.parentNode.parentNode.dataset.subtaskIndex, event.currentTarget.parentNode.previousElementSibling.querySelector('label')));
                });

                listItem.querySelectorAll('.subtasks-list .save-subtask-btn').forEach(button => {
                    button.addEventListener('click', (event) => saveEditedSubtask(task.id, event.currentTarget.parentNode.parentNode.dataset.subtaskIndex, event.currentTarget.parentNode.previousElementSibling.querySelector('input[type="text"]')));
                });

                listItem.querySelectorAll('.subtasks-list .cancel-subtask-btn').forEach(button => {
                    button.addEventListener('click', (event) => cancelEditSubtask(task.id, event.currentTarget.parentNode.parentNode.dataset.subtaskIndex, event.currentTarget.parentNode.previousElementSibling.querySelector('label')));
                });
            }
        });

        // Aplica a visibilidade das imagens com base na preferência do usuário.
        applyImageVisibility();
    }

    // Função para adicionar uma nova tarefa ou salvar alterações em uma existente.
    function addTask() {
        // Limpa mensagens de erro ao tentar adicionar/salvar.
        clearError(taskTitleInput, taskTitleError);
        clearError(taskDescriptionInput, taskDescriptionError);

        const title = taskTitleInput.value.trim(); // Obtém e limpa o título da tarefa.
        const description = taskDescriptionInput.value.trim(); // Obtém e limpa a descrição.
        const priority = taskPriorityInput.value; // Obtém a prioridade.
        const dueDate = taskDueDateInput.value; // Obtém a data de vencimento.

        // Validação básica do título.
        if (!title) {
            displayError(taskTitleInput, taskTitleError, 'O título da tarefa é obrigatório.');
            showNotification('O título da tarefa é obrigatório!', 'error');
            return;
        }

        let tasks = getTasks(); // Obtém as tarefas atuais.

        if (editingTaskId) {
            // Se `editingTaskId` não for nulo, estamos no modo de edição.
            tasks = tasks.map(task => {
                if (task.id === editingTaskId) {
                    // Atualiza a tarefa com os novos valores.
                    return {
                        ...task,
                        title,
                        description,
                        priority,
                        dueDate,
                        subtasks: currentSubtasks,
                        imageUrls: currentImagesBase64 // Salva as URLs Base64 atualizadas
                    };
                }
                return task;
            });
            showNotification('Tarefa atualizada com sucesso!', 'success'); // Notificação de atualização.
        } else {
            // Se não estiver editando, cria uma nova tarefa.
            const newTask = {
                id: Date.now(), // Usa o timestamp como ID único.
                title,
                description,
                priority,
                dueDate,
                createdAt: new Date().toISOString().split('T')[0], // Data de criação no formato YYYY-MM-DD
                completed: false, // Nova tarefa não está completa por padrão.
                subtasks: currentSubtasks, // Adiciona as subtarefas temporárias.
                imageUrls: currentImagesBase64 // Adiciona as imagens em Base64.
            };
            tasks.push(newTask); // Adiciona a nova tarefa ao array.
            showNotification('Tarefa adicionada com sucesso!', 'success'); // Notificação de adição.
        }

        saveTasks(tasks); // Salva o array de tarefas atualizado.
        clearForm(); // Limpa o formulário.
        renderTaskList(); // Re-renderiza a lista de tarefas.
    }

    // Função para adicionar uma subtarefa temporária ao array `currentSubtasks`.
    function addSubtask() {
        clearError(subtaskInput, subtaskInputError); // Limpa mensagens de erro.
        const subtaskName = subtaskInput.value.trim(); // Obtém e limpa o nome da subtarefa.

        if (!subtaskName) {
            displayError(subtaskInput, subtaskInputError, 'O nome da subtarefa não pode ser vazio.');
            showNotification('O nome da subtarefa é obrigatório!', 'error');
            return;
        }

        // Adiciona a nova subtarefa ao array temporário.
        currentSubtasks.push({ name: subtaskName, completed: false });
        subtaskInput.value = ''; // Limpa o campo de input da subtarefa.
        renderCurrentSubtasks(); // Re-renderiza a lista de subtarefas temporárias.
        showNotification('Subtarefa adicionada temporariamente.', 'info');
    }

    // Função para alternar o status de conclusão de uma tarefa.
    function toggleTaskCompletion(id) {
        let tasks = getTasks(); // Obtém as tarefas.
        tasks = tasks.map(task => {
            if (task.id === id) {
                // Se a tarefa já está completa e tem subtarefas, reabre.
                // Se está pendente ou não tem subtarefas, marca como completa (se tiver subtarefas, marca todas).
                const shouldComplete = calculateCompletionPercentage(task) < 100 || (task.subtasks && task.subtasks.length === 0);
                return {
                    ...task,
                    // Se for para completar, marca todas as subtarefas como completas.
                    subtasks: task.subtasks ? task.subtasks.map(sub => ({ ...sub, completed: shouldComplete })) : [],
                    // O campo 'completed' da tarefa principal é mais semântico, mas a porcentagem já indica o status.
                    // Podemos definir uma propriedade 'isCompletedManual' se houver necessidade de diferenciar
                    // entre 100% de subtasks concluídas e uma "tarefa simples" marcada como concluída.
                    // Por enquanto, a lógica de renderização se baseia em calculateCompletionPercentage.
                };
            }
            return task;
        });
        saveTasks(tasks); // Salva as tarefas atualizadas.
        renderTaskList(); // Re-renderiza a lista.
        showNotification('Status da tarefa atualizado!', 'success');
    }

    // Função para alternar o status de conclusão de uma subtarefa.
    function toggleSubtaskCompletion(taskId, subtaskIndex) {
        let tasks = getTasks(); // Obtém as tarefas.
        tasks = tasks.map(task => {
            if (task.id === parseInt(taskId) && task.subtasks && task.subtasks[subtaskIndex]) {
                // Alterna o status 'completed' da subtarefa específica.
                task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
            }
            return task;
        });
        saveTasks(tasks); // Salva as tarefas atualizadas.
        renderTaskList(); // Re-renderiza a lista.
        showNotification('Status da subtarefa atualizado!', 'info');
    }

    // Função para remover uma subtarefa de uma tarefa específica.
    function removeSubtaskFromTask(taskId, subtaskIndex) {
        let tasks = getTasks(); // Obtém as tarefas.
        tasks = tasks.map(task => {
            if (task.id === parseInt(taskId)) {
                // Remove a subtarefa do array da tarefa.
                task.subtasks.splice(subtaskIndex, 1);
            }
            return task;
        });
        saveTasks(tasks); // Salva as tarefas atualizadas.
        renderTaskList(); // Re-renderiza a lista.
        showNotification('Subtarefa removida da tarefa.', 'success');
    }

    // Função para ativar o modo de edição de uma subtarefa existente.
    function editSubtaskInTask(taskId, subtaskIndex, labelElement) {
        // Cria um input de texto e preenche com o nome da subtarefa.
        const input = document.createElement('input');
        input.type = 'text';
        input.value = labelElement.textContent; // Texto original do label.
        input.classList.add('edit-subtask-input');
        
        // Substitui o label pelo input.
        labelElement.parentNode.replaceChild(input, labelElement);
        input.focus(); // Coloca o foco no input.

        // Esconde o botão de editar, mostra os botões de salvar e cancelar.
        const parentDiv = input.parentNode.parentNode; // O li da subtarefa
        parentDiv.querySelector('.edit-subtask-btn').style.display = 'none';
        parentDiv.querySelector('.save-subtask-btn').style.display = 'inline-flex';
        parentDiv.querySelector('.cancel-subtask-btn').style.display = 'inline-flex';
        parentDiv.querySelector('.remove-subtask-btn').style.display = 'none'; // Esconde o remover enquanto edita

        // Esconde o checkbox.
        parentDiv.querySelector('input[type="checkbox"]').style.display = 'none';
    }

    // Função para salvar uma subtarefa editada.
    function saveEditedSubtask(taskId, subtaskIndex, inputElement) {
        const newName = inputElement.value.trim(); // Obtém o novo nome.
        if (!newName) {
            showNotification('O nome da subtarefa não pode ser vazio!', 'error');
            return;
        }

        let tasks = getTasks(); // Obtém as tarefas.
        tasks = tasks.map(task => {
            if (task.id === parseInt(taskId) && task.subtasks && task.subtasks[subtaskIndex]) {
                task.subtasks[subtaskIndex].name = newName; // Atualiza o nome da subtarefa.
            }
            return task;
        });
        saveTasks(tasks); // Salva as tarefas.
        renderTaskList(); // Re-renderiza a lista.
        showNotification('Subtarefa editada com sucesso!', 'success');
    }

    // Função para cancelar a edição de uma subtarefa.
    function cancelEditSubtask(taskId, subtaskIndex, labelElement) {
        // Reverte o input de volta para o label.
        const inputElement = labelElement.parentNode.querySelector('.edit-subtask-input');
        if (inputElement) {
            inputElement.parentNode.replaceChild(labelElement, inputElement);
        }
        
        // Mostra o botão de editar, esconde os botões de salvar e cancelar.
        const parentDiv = labelElement.parentNode.parentNode;
        parentDiv.querySelector('.edit-subtask-btn').style.display = 'inline-flex';
        parentDiv.querySelector('.save-subtask-btn').style.display = 'none';
        parentDiv.querySelector('.cancel-subtask-btn').style.display = 'none';
        parentDiv.querySelector('.remove-subtask-btn').style.display = 'inline-flex'; // Mostra o remover novamente

        // Mostra o checkbox.
        parentDiv.querySelector('input[type="checkbox"]').style.display = 'inline-block';
        showNotification('Edição de subtarefa cancelada.', 'info');
    }

    // Função para exportar as tarefas para um arquivo JSON.
    function exportTasks() {
        const tasks = getTasks(); // Obtém as tarefas.
        const dataStr = JSON.stringify(tasks, null, 4); // Converte para JSON formatado.
        const blob = new Blob([dataStr], { type: 'application/json' }); // Cria um Blob de dados.
        const url = URL.createObjectURL(blob); // Cria uma URL para o Blob.
        const a = document.createElement('a'); // Cria um elemento <a> para download.
        a.href = url;
        a.download = 'tarefas.json'; // Nome do arquivo.
        document.body.appendChild(a); // Adiciona o elemento ao DOM temporariamente.
        a.click(); // Simula um clique para iniciar o download.
        document.body.removeChild(a); // Remove o elemento.
        URL.revokeObjectURL(url); // Libera a URL do objeto.
        showNotification('Tarefas exportadas com sucesso!', 'success');
    }

    // Função para importar tarefas de um arquivo JSON.
    function importTasks(event) {
        const file = event.target.files[0]; // Obtém o arquivo selecionado.
        if (!file) {
            showNotification('Nenhum arquivo selecionado para importação.', 'info');
            return;
        }

        const reader = new FileReader(); // Cria um FileReader.
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result); // Parseia o conteúdo JSON.
                // Validação básica para garantir que é um array e contém objetos com 'id'.
                if (Array.isArray(importedTasks) && importedTasks.every(task => typeof task === 'object' && task.id)) {
                    saveTasks(importedTasks); // Salva as tarefas importadas, substituindo as existentes.
                    renderTaskList(); // Re-renderiza a lista.
                    showNotification('Tarefas importadas com sucesso!', 'success');
                } else {
                    showNotification('Formato de arquivo JSON inválido para tarefas.', 'error');
                }
            } catch (error) {
                console.error("Erro ao importar arquivo:", error);
                showNotification('Erro ao ler ou parsear o arquivo JSON.', 'error');
            }
        };
        reader.onerror = () => {
            showNotification('Erro ao carregar o arquivo.', 'error');
        };
        reader.readAsText(file); // Lê o conteúdo do arquivo como texto.
        importFile.value = ''; // Limpa o input de arquivo para permitir nova importação do mesmo arquivo.
    }

    // Função para aplicar a visibilidade das imagens na lista de tarefas.
    function applyImageVisibility() {
        const showImages = toggleImagesCheckbox.checked; // Verifica o estado do checkbox.
        // Itera sobre todos os contêineres de imagem das tarefas.
        document.querySelectorAll('.task-image-container.multiple-images-display').forEach(container => {
            if (showImages) {
                container.style.display = 'flex'; // Exibe as imagens.
            } else {
                container.style.display = 'none'; // Oculta as imagens.
            }
        });
    }

    // --- Listeners de Eventos ---

    // Listener para o botão de adicionar/salvar tarefa.
    addTaskBtn.addEventListener('click', addTask);

    // Listeners para os campos de input, limpando erros ao digitar.
    taskTitleInput.addEventListener('input', () => clearError(taskTitleInput, taskTitleError));
    taskDescriptionInput.addEventListener('input', () => clearError(taskDescriptionInput, taskDescriptionError));
    subtaskInput.addEventListener('input', () => clearError(subtaskInput, subtaskInputError));

    // Listener para o botão de adicionar subtarefa.
    addSubtaskBtn.addEventListener('click', addSubtask);

    // Listener para o input de imagens (quando arquivos são selecionados).
    taskImagesInput.addEventListener('change', handleImageUpload);

    // Listeners para os seletores de filtro e ordenação, que re-renderizam a lista.
    filterStatusSelect.addEventListener('change', renderTaskList);
    sortBySelect.addEventListener('change', renderTaskList);
    filterPrioritySelect.addEventListener('change', renderTaskList);

    // Listener para o botão de exportar.
    exportBtn.addEventListener('click', exportTasks);

    // Listener para quando um arquivo é selecionado no input de importação.
    importFile.addEventListener('change', importTasks);
    // Listener para o botão de importar (na verdade, o `change` do input `importFile` já lida com isso).
    // importBtn.addEventListener('click', () => importFile.click()); // Esta linha seria para simular o clique no input file

    // Listener para o campo de busca (pesquisa em tempo real).
    searchInput.addEventListener('input', () => {
        // Salva o termo de busca no localStorage para persistência.
        localStorage.setItem('searchQuery', searchInput.value);
        renderTaskList(); // Re-renderiza a lista com o filtro de busca aplicado.
    });

    // Adiciona listener para o checkbox de ocultar/exibir imagens.
    toggleImagesCheckbox.addEventListener('change', () => {
        applyImageVisibility(); // Aplica a visibilidade.
        // Salva a preferência do usuário no localStorage.
        localStorage.setItem('showImages', toggleImagesCheckbox.checked);
    });

    // Listeners para os botões do modal de confirmação de exclusão de tarefa.
    confirmDeleteBtn.addEventListener('click', () => {
        if (taskIdToDeleteConfirmed !== null) {
            performDeleteTask(taskIdToDeleteConfirmed); // Chama a função real de exclusão.
            taskIdToDeleteConfirmed = null; // Reseta o ID após a ação.
        }
        confirmationModal.style.display = 'none'; // Esconde o modal.
    });

    cancelDeleteBtn.addEventListener('click', () => {
        taskIdToDeleteConfirmed = null; // Reseta o ID.
        confirmationModal.style.display = 'none'; // Esconde o modal.
    });

    closeButton.addEventListener('click', () => {
        taskIdToDeleteConfirmed = null; // Reseta o ID.
        confirmationModal.style.display = 'none'; // Esconde o modal.
    });

    // Fecha o modal se clicar fora dele.
    window.addEventListener('click', (event) => {
        if (event.target === confirmationModal) {
            taskIdToDeleteConfirmed = null; // Reseta o ID.
            confirmationModal.style.display = 'none';
        }
    });

    // --- Funções de Inicialização e Carregamento ---

    // Função para deletar uma tarefa (é chamada após a confirmação do modal).
    function performDeleteTask(id) {
        let tasks = getTasks(); // Obtém as tarefas.
        // Filtra o array, removendo a tarefa com o ID correspondente.
        tasks = tasks.filter(task => task.id !== id);
        saveTasks(tasks); // Salva o array atualizado.
        renderTaskList(); // Re-renderiza a lista.
        showNotification('Tarefa excluída com sucesso!', 'success');
    }

    // Função para carregar preferências do usuário (busca e visibilidade de imagens) do LocalStorage.
    function loadUserPreferences() {
        const savedSearchQuery = localStorage.getItem('searchQuery');
        if (savedSearchQuery) {
            searchInput.value = savedSearchQuery; // Restaura o termo de busca.
        }

        const savedShowImages = localStorage.getItem('showImages');
        // Se a preferência foi salva, a converte para booleano. Caso contrário, o padrão é true.
        toggleImagesCheckbox.checked = savedShowImages !== null ? JSON.parse(savedShowImages) : true;
        applyImageVisibility(); // Aplica a visibilidade ao carregar.
    }

    // --- Chamadas Iniciais ---
    loadUserPreferences(); // Carrega as preferências do usuário ao iniciar.
    renderTaskList(); // Renderiza a lista de tarefas pela primeira vez ao carregar a página.
    renderCurrentSubtasks(); // Renderiza as subtarefas temporárias (inicialmente vazias).
});