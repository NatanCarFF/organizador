document.addEventListener('DOMContentLoaded', () => {
    // Seletores de elementos HTML para fácil acesso
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskPriorityInput = document.getElementById('taskPriority');
    const taskDueDateInput = document.getElementById('taskDueDate');
    const taskImagesInput = document.getElementById('taskImages'); // ATUALIZADO: ID para múltiplos arquivos
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const taskListSection = document.getElementById('taskListSection');

    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');
    const importBtn = document.getElementById('importBtn');

    const addSubtaskBtn = document.getElementById('addSubtaskBtn');
    const subtaskInput = document.getElementById('subtaskInput');
    const subtaskListContainer = document.getElementById('subtaskList');

    const notificationContainer = document.getElementById('notificationContainer');

    // Seletores para filtros e ordenação
    const filterStatusSelect = document.getElementById('filterStatus');
    const sortBySelect = document.getElementById('sortBy');
    const filterPrioritySelect = document.getElementById('filterPriority');

    // Seletores para busca
    const searchInput = document.getElementById('searchInput');

    // Seletor para ocultar/exibir imagens
    const toggleImagesCheckbox = document.getElementById('toggleImages');

    // NOVO: Seletor para ocultar/exibir seção de adicionar tarefa
    const toggleAddTaskSectionCheckbox = document.getElementById('toggleAddTaskSection');
    const addTaskSection = document.getElementById('addTaskSection'); // Referência à seção "Adicionar Tarefa"

    // Seletores para as mensagens de erro (Validação de Formulário Mais Visível)
    const taskTitleError = document.getElementById('taskTitleError');
    const taskDescriptionError = document.getElementById('taskDescriptionError');
    const subtaskInputError = document.getElementById('subtaskInputError');

    // Seletores para o modal de confirmação
    const confirmationModal = document.getElementById('confirmationModal');
    confirmationModal.style.display = 'none'; // Garante que o modal esteja oculto ao carregar a página
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const closeButton = document.querySelector('.close-button'); // Botão 'x' do modal

    let currentSubtasks = [];
    let editingTaskId = null;
    let currentImagesBase64 = []; // ATUALIZADO: Array para armazenar múltiplas imagens em base64
    let taskIdToDeleteConfirmed = null; // Armazena o ID da tarefa a ser excluída após confirmação

    // --- FUNÇÕES AUXILIARES ---

    /**
     * Exibe uma notificação na tela.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - O tipo da notificação ('success', 'error', 'info').
     */
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);

        let iconClass = '';
        if (type === 'success') {
            iconClass = 'fas fa-check-circle';
        } else if (type === 'error') {
            iconClass = 'fas fa-exclamation-triangle';
        } else if (type === 'info') {
            iconClass = 'fas fa-info-circle';
        }

        notification.innerHTML = `<i class="${iconClass}"></i> ${message}`;
        notificationContainer.appendChild(notification);

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
        inputElement.classList.add('input-error');
        errorElement.textContent = message;
    }

    /**
     * Limpa a mensagem de erro e remove o estilo de erro de um campo.
     * @param {HTMLElement} inputElement - O elemento input/textarea associado ao erro.
     * @param {HTMLElement} errorElement - O elemento span onde a mensagem de erro foi exibida.
     */
    function clearError(inputElement, errorElement) {
        inputElement.classList.remove('input-error');
        errorElement.textContent = '';
    }

    // Função para lidar com o upload de MÚLTIPLAS imagens e exibir preview
    function handleImageUpload(event) {
        const files = Array.from(event.target.files).slice(0, 5); // Limita a 5 arquivos
        currentImagesBase64 = []; // Zera o array de imagens no upload de novos arquivos
        imagePreviewContainer.innerHTML = ''; // Limpa previews anteriores

        if (files.length > 0) {
            imagePreviewContainer.style.display = 'flex'; // Exibe o contêiner de preview
        } else {
            imagePreviewContainer.style.display = 'none'; // Oculta se não houver arquivos
        }

        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('image-preview-item');

                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = `Preview da Imagem ${index + 1}`;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.classList.add('remove-image-preview-btn');
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.dataset.index = currentImagesBase64.length; // Usa o tamanho atual como índice
                removeBtn.addEventListener('click', removeImagePreview);

                imgContainer.appendChild(img);
                imgContainer.appendChild(removeBtn);
                imagePreviewContainer.appendChild(imgContainer);
                currentImagesBase64.push(e.target.result); // Adiciona ao array principal
            };
            reader.readAsDataURL(file);
        });
    }

    // Função para remover uma imagem do preview
    function removeImagePreview(event) {
        const clickedButton = event.currentTarget; // Usa currentTarget para garantir que pega o botão, não o ícone
        const indexToRemove = Array.from(imagePreviewContainer.children).indexOf(clickedButton.parentNode);

        if (indexToRemove > -1) {
            currentImagesBase64.splice(indexToRemove, 1); // Remove do array de base64
            clickedButton.parentNode.remove(); // Remove o elemento do DOM

            // Se não houver mais imagens, ocultar o container de preview
            if (currentImagesBase64.length === 0) {
                imagePreviewContainer.style.display = 'none';
                taskImagesInput.value = ''; // Limpa o input file
            }
            
            // Reajusta os data-index dos botões de remoção restantes
            Array.from(imagePreviewContainer.children).forEach((item, idx) => {
                const btn = item.querySelector('.remove-image-preview-btn');
                if (btn) btn.dataset.index = idx;
            });
            showNotification('Imagem removida.', 'success');
        }
    }

    // Função para limpar TODO o preview de imagem
    function clearImagePreview() {
        imagePreviewContainer.innerHTML = '';
        imagePreviewContainer.style.display = 'none';
        currentImagesBase64 = []; // Limpa o array de imagens
        if (taskImagesInput) { // Verifica se o elemento existe antes de tentar limpar
            taskImagesInput.value = ''; // Limpa o input file
        }
    }


    // Função auxiliar para salvar o array de tarefas no LocalStorage
    function saveTasks(tasks) {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (e) {
            console.error("Erro ao salvar tarefas no localStorage:", e);
            showNotification('Erro ao salvar dados!', 'error');
        }
    }

    // Função auxiliar para obter o array de tarefas do LocalStorage
    function getTasks() {
        try {
            const tasksString = localStorage.getItem('tasks');
            return tasksString ? JSON.parse(tasksString) : [];
        } catch (e) {
            console.error("Erro ao carregar tarefas do localStorage. Dados podem estar corrompidos.", e);
            localStorage.removeItem('tasks');
            showNotification('Erro ao carregar dados salvos. Dados antigos foram removidos.', 'error');
            return [];
        }
    }

    // Função para calcular a porcentagem de conclusão de uma tarefa
    function calculateCompletionPercentage(task) {
        if (!task.subtasks || task.subtasks.length === 0) {
            return 0;
        }
        const completedSubtasks = task.subtasks.filter(sub => sub.completed).length;
        return (completedSubtasks / task.subtasks.length) * 100;
    }

    // Função para renderizar as subtarefas temporárias (na seção "Adicionar Tarefa")
    function renderCurrentSubtasks() {
        subtaskListContainer.innerHTML = '';
        if (currentSubtasks.length === 0) {
            subtaskListContainer.innerHTML = '<p class="no-subtasks-message">Nenhuma subtarefa adicionada.</p>';
        } else {
            currentSubtasks.forEach((subtask, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${subtask.name}</span>
                    <button type="button" class="remove-subtask-btn" data-index="${index}">
                        <i class="fas fa-times-circle"></i> Remover
                    </button>
                `;
                li.querySelector('.remove-subtask-btn').addEventListener('click', function() {
                    const indexToRemove = parseInt(this.dataset.index);
                    currentSubtasks.splice(indexToRemove, 1);
                    renderCurrentSubtasks();
                    showNotification('Subtarefa removida.', 'success');
                });
                subtaskListContainer.appendChild(li);
            });
        }
    }

    // Função para limpar o formulário e reverter para o modo "Adicionar Tarefa"
    function clearForm() {
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        taskPriorityInput.value = 'medium'; // Volta para o padrão
        taskDueDateInput.value = '';
        clearImagePreview(); // Limpa o preview e o array de imagens
        currentSubtasks = [];
        renderCurrentSubtasks();
        editingTaskId = null;
        addTaskBtn.innerHTML = '<i class="fas fa-check-circle"></i> Adicionar Tarefa';
        addTaskBtn.classList.remove('save-changes-btn');

        // Limpa as mensagens de erro ao limpar o formulário
        clearError(taskTitleInput, taskTitleError);
        clearError(taskDescriptionInput, taskDescriptionError);
        clearError(subtaskInput, subtaskInputError);
    }

    // Função para preencher o formulário para edição de tarefa
    function populateFormForEdit(task) {
        taskTitleInput.value = task.title;
        taskDescriptionInput.value = task.description;
        taskPriorityInput.value = task.priority || 'medium';
        taskDueDateInput.value = task.dueDate || '';

        // ATUALIZADO: Preenche e exibe as múltiplas imagens
        imagePreviewContainer.innerHTML = ''; // Limpa qualquer preview existente
        currentImagesBase64 = task.imageUrls ? [...task.imageUrls] : []; // Carrega as URLs da tarefa

        if (currentImagesBase64.length > 0) {
            imagePreviewContainer.style.display = 'flex'; // Garante que o contêiner esteja visível
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
                removeBtn.dataset.index = index; // Armazena o índice original da imagem
                removeBtn.addEventListener('click', removeImagePreview);

                imgContainer.appendChild(img);
                imgContainer.appendChild(removeBtn);
                imagePreviewContainer.appendChild(imgContainer);
            });
        } else {
            clearImagePreview(); // Oculta e limpa se não houver imagens
        }

        currentSubtasks = task.subtasks ? [...task.subtasks] : [];
        renderCurrentSubtasks();
        editingTaskId = task.id;
        addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        addTaskBtn.classList.add('save-changes-btn');
        showNotification('Modo de edição ativado!', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Limpa erros anteriores ao entrar no modo de edição
        clearError(taskTitleInput, taskTitleError);
        clearError(taskDescriptionInput, taskDescriptionError);
        clearError(subtaskInput, subtaskInputError);
    }

    // Função para determinar o status da data de vencimento
    function getDueDateStatus(dueDate) {
        if (!dueDate) return '';

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        if (due < today) {
            return 'overdue'; // Vencida
        } else if (due.getTime() === today.getTime()) {
            return 'due-today'; // Vence hoje
        } else {
            const diffTime = Math.abs(due.getTime() - today.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 3) { // Vence em 3 dias ou menos
                return 'due-soon';
            }
        }
        return ''; // Sem status especial
    }

    // Função para aplicar filtro, busca e ordenação antes de renderizar
    function applyFiltersAndSorting(tasks) {
        let filteredTasks = [...tasks];
        const currentSearchQuery = searchInput.value.toLowerCase().trim();

        // 0. Aplica a busca
        if (currentSearchQuery) {
            filteredTasks = filteredTasks.filter(task =>
                task.title.toLowerCase().includes(currentSearchQuery) ||
                (task.description && task.description.toLowerCase().includes(currentSearchQuery))
            );
        }

        // 1. Aplica o filtro de status
        const filterStatus = filterStatusSelect.value;
        if (filterStatus === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (filterStatus === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }

        // 2. Aplica o filtro de prioridade
        const filterPriority = filterPrioritySelect.value;
        if (filterPriority !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
        }

        // 3. Aplica a ordenação
        const sortBy = sortBySelect.value;
        filteredTasks.sort((a, b) => {
            if (sortBy === 'addedAsc') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            } else if (sortBy === 'addedDesc') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (sortBy === 'priorityHigh') {
                const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            } else if (sortBy === 'priorityLow') {
                const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            } else if (sortBy === 'titleAsc') {
                return a.title.localeCompare(b.title);
            } else if (sortBy === 'titleDesc') {
                return b.title.localeCompare(a.title);
            } else if (sortBy === 'completionAsc') {
                return calculateCompletionPercentage(a) - calculateCompletionPercentage(b);
            } else if (sortBy === 'completionDesc') {
                return calculateCompletionPercentage(b) - calculateCompletionPercentage(a);
            } else if (sortBy === 'dueDateAsc') {
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
            return 0;
        });
        return filteredTasks;
    }

    // Função para formatar a data para exibição
    function formatDate(dateString) {
        if (!dateString) return 'Não definida';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', options);
    }

    // Função principal para renderizar a lista de tarefas
    function renderTaskList() {
        const tasks = getTasks();
        const filteredAndSortedTasks = applyFiltersAndSorting(tasks);
        taskList.innerHTML = ''; // Limpa a lista existente

        if (filteredAndSortedTasks.length === 0) {
            taskList.innerHTML = '<p class="no-tasks-message">Nenhuma tarefa encontrada. Comece adicionando uma!</p>';
            return;
        }

        filteredAndSortedTasks.forEach(task => {
            const listItem = document.createElement('li');
            listItem.classList.add('task-item');
            listItem.dataset.id = task.id; // Armazena o ID da tarefa no elemento HTML

            // Adiciona classe de status de conclusão
            if (task.completed) {
                listItem.classList.add('task-complete');
            }

            // Adiciona classe de prioridade
            listItem.classList.add(`priority-${task.priority || 'medium'}`);

            const dueDateStatusClass = getDueDateStatus(task.dueDate);
            const dueDateText = formatDate(task.dueDate);

            // Calcula a porcentagem de conclusão das subtarefas
            const completionPercentage = calculateCompletionPercentage(task);

            // ATUALIZADO: Renderiza MÚLTIPLAS imagens
            let imagesHtml = '';
            // A classe 'hide-images' é aplicada no #taskListSection, não aqui
            if (task.imageUrls && task.imageUrls.length > 0) {
                const imageElements = task.imageUrls.map(url =>
                    ` <img src="${url}" alt="Imagem da tarefa" class="task-image"> `).join('');
                imagesHtml = `<div class="task-image-container multiple-images-display">${imageElements}</div>`;
            }

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
                                    <button type="button" class="remove-subtask-btn"><i class="fas fa-times-circle"></i></button>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                `;
            }

            listItem.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description || 'Sem descrição.'}</p>
                <p><strong>Prioridade:</strong> <span class="priority-text">${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Média'}</span></p>
                <p><strong>Vencimento:</strong> <span class="due-date-status ${dueDateStatusClass}">${dueDateText}</span></p>
                
                ${imagesHtml}

                <div class="task-status-thermometer">
                    <div class="thermometer-fill" style="width: ${completionPercentage.toFixed(0)}%;"></div>
                </div>
                <p><strong>Progresso:</strong> ${completionPercentage.toFixed(0)}% concluído</p>
                
                ${subtasksHtml}

                <div class="task-meta">
                    <p>Criado em: ${formatDate(task.createdAt)}</p>
                    <label for="task-complete-${task.id}">
                        <input type="checkbox" id="task-complete-${task.id}" class="task-completion-checkbox" ${task.completed ? 'checked' : ''}>
                        Marcar como Concluída
                    </label>
                </div>

                <div class="task-actions">
                    <button type="button" class="edit-btn"><i class="fas fa-edit"></i> Editar</button>
                    <button type="button" class="delete-btn"><i class="fas fa-trash-alt"></i> Excluir</button>
                </div>
            `;
            taskList.appendChild(listItem);
        });

        // Adiciona event listeners para os botões de exclusão
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const taskId = parseInt(this.closest('.task-item').dataset.id);
                taskIdToDeleteConfirmed = taskId; // Armazena o ID
                confirmationModal.style.display = 'flex'; // Exibe o modal
            });
        });

        // Adiciona event listeners para os botões de edição
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const taskId = parseInt(this.closest('.task-item').dataset.id);
                const tasks = getTasks();
                const taskToEdit = tasks.find(task => task.id === taskId);
                if (taskToEdit) {
                    populateFormForEdit(taskToEdit);
                } else {
                    showNotification('Erro: Tarefa não encontrada para edição.', 'error');
                }
            });
        });

        // Adiciona event listeners para os checkboxes de conclusão da tarefa principal
        document.querySelectorAll('.task-completion-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const taskId = parseInt(this.closest('.task-item').dataset.id);
                const isCompleted = this.checked;
                updateTaskCompletionStatus(taskId, isCompleted);
            });
        });

        // Adiciona event listeners para os checkboxes de subtarefas
        document.querySelectorAll('.subtasks-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const listItem = this.closest('li');
                const taskId = parseInt(listItem.dataset.taskId);
                const subtaskIndex = parseInt(listItem.dataset.subtaskIndex);
                const isCompleted = this.checked;
                updateSubtaskCompletionStatus(taskId, subtaskIndex, isCompleted);
            });
        });

        // Adiciona event listeners para os botões de remover subtarefas na lista de tarefas
        document.querySelectorAll('.subtasks-list .remove-subtask-btn').forEach(button => {
            button.addEventListener('click', function() {
                const li = this.closest('li');
                const taskId = parseInt(li.dataset.taskId);
                const subtaskIndex = parseInt(li.dataset.subtaskIndex);

                let tasks = getTasks();
                const task = tasks.find(t => t.id === taskId);
                if (task && task.subtasks) {
                    task.subtasks.splice(subtaskIndex, 1);
                    saveTasks(tasks);
                    renderTaskList(); // Re-renderiza toda a lista para aplicar as mudanças
                    showNotification('Subtarefa removida.', 'success');
                } else {
                    showNotification('Erro ao remover subtarefa.', 'error');
                }
            });
        });

        // Adiciona event listeners para os botões de editar subtarefas
        document.querySelectorAll('.edit-subtask-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const li = this.closest('li');
                const taskId = parseInt(li.dataset.taskId);
                const subtaskIndex = parseInt(li.dataset.subtaskIndex);

                let tasks = getTasks();
                const task = tasks.find(t => t.id === taskId);

                if (task && task.subtasks && task.subtasks[subtaskIndex]) {
                    const subtask = task.subtasks[subtaskIndex];
                    const label = li.querySelector('label');
                    const currentName = label.textContent;

                    const editInput = document.createElement('input');
                    editInput.type = 'text';
                    editInput.classList.add('subtask-edit-input');
                    editInput.value = currentName;

                    label.style.display = 'none'; // Esconde o label
                    li.querySelector('div').insertBefore(editInput, label); // Insere antes do label

                    // Esconde editar, mostra salvar/cancelar
                    this.style.display = 'none';
                    li.querySelector('.save-subtask-btn').style.display = 'inline-flex';
                    li.querySelector('.cancel-subtask-btn').style.display = 'inline-flex';
                    editInput.focus();
                } else {
                    showNotification('Erro: Subtarefa não encontrada para edição.', 'error');
                }
            });
        });

        // Adiciona event listeners para os botões de salvar subtarefas
        document.querySelectorAll('.save-subtask-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const li = this.closest('li');
                const taskId = parseInt(li.dataset.taskId);
                const subtaskIndex = parseInt(li.dataset.subtaskIndex);
                const editInput = li.querySelector('.subtask-edit-input');
                const newName = editInput.value.trim();

                if (!newName) {
                    showNotification('O nome da subtarefa não pode ser vazio!', 'error');
                    editInput.focus();
                    return;
                }

                let tasks = getTasks();
                const task = tasks.find(t => t.id === taskId);
                if (task && task.subtasks && task.subtasks[subtaskIndex]) {
                    task.subtasks[subtaskIndex].name = newName;
                    saveTasks(tasks);
                    renderTaskList(); // Re-renderiza toda a lista para aplicar as mudanças
                    showNotification('Subtarefa atualizada com sucesso!', 'success');
                } else {
                    showNotification('Erro ao salvar subtarefa.', 'error');
                }
            });
        });

        // Adiciona event listeners para os botões de cancelar edição de subtarefas
        document.querySelectorAll('.cancel-subtask-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const li = this.closest('li');
                const label = li.querySelector('label');
                const editInput = li.querySelector('.subtask-edit-input');

                editInput.remove(); // Remove o input
                label.style.display = 'inline'; // Exibe o label novamente

                // Esconde salvar/cancelar, mostra editar
                this.style.display = 'none';
                li.querySelector('.save-subtask-btn').style.display = 'none';
                li.querySelector('.edit-subtask-btn').style.display = 'inline-flex';
            });
        });
    }

    // Função para atualizar o status de conclusão da tarefa principal
    function updateTaskCompletionStatus(id, isCompleted) {
        let tasks = getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = isCompleted;
            saveTasks(tasks);
            renderTaskList();
            showNotification(`Tarefa marcada como ${isCompleted ? 'concluída' : 'pendente'}!`, 'success');
        } else {
            showNotification('Erro ao atualizar status da tarefa.', 'error');
        }
    }

    // Função para atualizar o status de conclusão de uma subtarefa
    function updateSubtaskCompletionStatus(taskId, subtaskIndex, isCompleted) {
        let tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task && task.subtasks && task.subtasks[subtaskIndex]) {
            task.subtasks[subtaskIndex].completed = isCompleted;
            saveTasks(tasks);
            renderTaskList();
            showNotification(`Subtarefa ${isCompleted ? 'concluída' : 'reaberta'}!`, 'success');
        } else {
            showNotification('Erro ao atualizar subtarefa.', 'error');
        }
    }

    // Função para realmente excluir a tarefa (chamada após confirmação)
    function performDeleteTask(id) {
        let tasks = getTasks();
        const initialLength = tasks.length;
        tasks = tasks.filter(task => task.id !== id);
        if (tasks.length < initialLength) {
            saveTasks(tasks);
            renderTaskList();
            showNotification('Tarefa excluída com sucesso!', 'success');
        } else {
            showNotification('Erro ao excluir tarefa. Tarefa não encontrada.', 'error');
        }
    }

    // Função para aplicar/remover a classe que oculta imagens
    function applyImageVisibility() {
        if (!toggleImagesCheckbox.checked) {
            taskListSection.classList.add('hide-images');
        } else {
            taskListSection.classList.remove('hide-images');
        }
    }

    // NOVO: Função para aplicar/remover a classe que oculta a seção "Adicionar Tarefa"
    function applyAddTaskSectionVisibility() {
        if (!toggleAddTaskSectionCheckbox.checked) {
            addTaskSection.classList.add('hidden');
        } else {
            addTaskSection.classList.remove('hidden');
        }
    }


    // Carrega as tarefas salvas no LocalStorage e renderiza a lista
    function loadTasks() {
        // Carrega as preferências de filtro e ordenação
        const savedFilterStatus = localStorage.getItem('filterStatus');
        const savedSortBy = localStorage.getItem('sortBy');
        const savedSearchQuery = localStorage.getItem('searchQuery');
        const savedFilterPriority = localStorage.getItem('filterPriority');

        if (savedFilterStatus) {
            filterStatusSelect.value = savedFilterStatus;
        }
        if (savedSortBy) {
            sortBySelect.value = savedSortBy;
        }
        if (savedSearchQuery) {
            searchInput.value = savedSearchQuery;
        }
        if (savedFilterPriority) {
            filterPrioritySelect.value = savedFilterPriority;
        }

        // Carrega a preferência de exibição de imagens
        const savedImageVisibility = localStorage.getItem('showImages');
        if (savedImageVisibility !== null) {
            toggleImagesCheckbox.checked = JSON.parse(savedImageVisibility);
        }
        applyImageVisibility(); // Aplica a visibilidade inicial das imagens

        // NOVO: Carrega a preferência de exibição da seção "Adicionar Tarefa"
        const savedAddTaskSectionVisibility = localStorage.getItem('showAddTaskSection');
        if (savedAddTaskSectionVisibility !== null) {
            toggleAddTaskSectionCheckbox.checked = JSON.parse(savedAddTaskSectionVisibility);
        } else {
            // Define o padrão como visível se não houver preferência salva
            toggleAddTaskSectionCheckbox.checked = true;
        }
        applyAddTaskSectionVisibility(); // Aplica a visibilidade inicial da seção

        renderCurrentSubtasks(); // Renderiza subtarefas vazias inicialmente
        renderTaskList(); // Renderiza a lista de tarefas
    }


    // --- LISTENERS DE EVENTOS ---

    // Adiciona listener para o botão "Adicionar Tarefa" / "Salvar Alterações"
    addTaskBtn.addEventListener('click', () => {
        clearError(taskTitleInput, taskTitleError); // Limpa erros anteriores
        clearError(taskDescriptionInput, taskDescriptionError);

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const priority = taskPriorityInput.value;
        const dueDate = taskDueDateInput.value;

        // Validação básica: Título da tarefa é obrigatório
        if (!title) {
            displayError(taskTitleInput, taskTitleError, 'O título da tarefa é obrigatório.');
            showNotification('O título da tarefa é obrigatório.', 'error');
            taskTitleInput.focus();
            return;
        }

        const handleTaskSave = () => {
            let tasks = getTasks();
            if (editingTaskId) {
                // Modo de Edição
                const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
                if (taskIndex > -1) {
                    tasks[taskIndex].title = title;
                    tasks[taskIndex].description = description;
                    tasks[taskIndex].priority = priority;
                    tasks[taskIndex].dueDate = dueDate;
                    tasks[taskIndex].subtasks = [...currentSubtasks];
                    tasks[taskIndex].imageUrls = [...currentImagesBase64]; // ATUALIZADO: Salva o array de URLs
                    saveTasks(tasks);
                    showNotification('Tarefa atualizada com sucesso!', 'success');
                } else {
                    showNotification('Erro: Tarefa a ser editada não encontrada.', 'error');
                }
            } else {
                // Modo de Adição
                const task = {
                    id: Date.now(), // ID único baseado no timestamp
                    title,
                    description,
                    priority,
                    dueDate,
                    imageUrls: [...currentImagesBase64], // ATUALIZADO: Inclui o array de URLs na nova tarefa
                    subtasks: [...currentSubtasks],
                    completed: false, // Nova tarefa sempre começa como não concluída
                    createdAt: new Date().toISOString() // Data de criação
                };
                tasks.push(task);
                saveTasks(tasks);
                showNotification('Tarefa adicionada com sucesso!', 'success');
            }
            renderTaskList();
            clearForm();
        };

        handleTaskSave();
    });

    // Adiciona listener para o botão "Limpar Formulário"
    document.getElementById('clearFormBtn').addEventListener('click', clearForm);


    // Listener para adicionar subtarefa
    addSubtaskBtn.addEventListener('click', () => {
        clearError(subtaskInput, subtaskInputError); // Limpa erros anteriores
        const subtaskName = subtaskInput.value.trim();
        if (subtaskName) {
            currentSubtasks.push({ name: subtaskName, completed: false });
            subtaskInput.value = '';
            renderCurrentSubtasks();
            showNotification('Subtarefa adicionada temporariamente.', 'info');
        } else {
            displayError(subtaskInput, subtaskInputError, 'O nome da subtarefa não pode ser vazio.');
            showNotification('O nome da subtarefa é obrigatório!', 'error');
        }
    });

    // Listener para o input de imagens (ATUALIZADO para múltiplos arquivos)
    taskImagesInput.addEventListener('change', handleImageUpload);


    // Adiciona um listener para o botão de exportar tarefas
    exportBtn.addEventListener('click', () => {
        const tasks = getTasks();
        if (tasks.length === 0) {
            showNotification('Não há tarefas para exportar.', 'info');
            return;
        }
        const dataStr = JSON.stringify(tasks, null, 2); // Formata com indentação
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'painel_natan_tasks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Tarefas exportadas com sucesso!', 'success');
    });

    // Adiciona um listener para o botão de importar tarefas
    importBtn.addEventListener('click', () => {
        const files = importFile.files;
        if (files.length === 0) {
            showNotification('Por favor, selecione um arquivo JSON para importar.', 'info');
            return;
        }

        const file = files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (!Array.isArray(importedTasks)) {
                    showNotification('O arquivo JSON não contém uma lista de tarefas válida.', 'error');
                    return;
                }

                let existingTasks = getTasks();
                let newTasksAdded = 0;
                let tasksUpdated = 0;

                importedTasks.forEach(importedTask => {
                    // Garante que a tarefa importada tenha um createdAt e ID único
                    importedTask.createdAt = importedTask.createdAt || new Date().toISOString();
                    importedTask.id = importedTask.id || Date.now() + Math.floor(Math.random() * 1000); // Garante ID se ausente

                    // Garante que a tarefa tenha uma prioridade padrão se ausente
                    importedTask.priority = importedTask.priority || 'medium';
                    // Garante que a tarefa tenha uma data de vencimento se ausente
                    importedTask.dueDate = importedTask.dueDate || '';
                    // ATUALIZADO: Garante que a tarefa tenha um array de imagens (mesmo que vazio)
                    importedTask.imageUrls = importedTask.imageUrls || [];
                    // Garante que a tarefa tenha um status de conclusão
                    importedTask.completed = importedTask.hasOwnProperty('completed') ? importedTask.completed : false;
                    // Garante que a tarefa tenha subtarefas
                    importedTask.subtasks = importedTask.subtasks || [];


                    // Verifica se o ID já existe para evitar conflitos ao importar no mesmo ID
                    // ATUALIZADO: Prefere atualizar tarefa existente se o ID for o mesmo
                    const existingTaskIndex = existingTasks.findIndex(t => t.id === importedTask.id);
                    if (existingTaskIndex > -1) {
                        existingTasks[existingTaskIndex] = importedTask; // Sobrescreve a tarefa existente
                        tasksUpdated++;
                    } else {
                        existingTasks.push(importedTask); // Adiciona como nova tarefa
                        newTasksAdded++;
                    }
                });

                saveTasks(existingTasks);
                renderTaskList();
                showNotification(`Importação concluída: ${newTasksAdded} novas tarefas, ${tasksUpdated} tarefas atualizadas.`, 'success');

            } catch (error) {
                console.error("Erro ao importar tarefas:", error);
                showNotification('Erro ao processar o arquivo JSON. Verifique o formato.', 'error');
            }
        };

        reader.onerror = () => {
            showNotification('Erro ao ler o arquivo.', 'error');
        };

        reader.readAsText(file);
    });

    // Listener para filtros de status
    filterStatusSelect.addEventListener('change', () => {
        localStorage.setItem('filterStatus', filterStatusSelect.value); // Salva a preferência
        renderTaskList();
    });

    // Listener para filtros de prioridade
    filterPrioritySelect.addEventListener('change', () => {
        localStorage.setItem('filterPriority', filterPrioritySelect.value); // Salva a preferência
        renderTaskList();
    });

    // Listener para ordenação
    sortBySelect.addEventListener('change', () => {
        localStorage.setItem('sortBy', sortBySelect.value); // Salva a preferência
        renderTaskList();
    });

    // Listener para busca
    searchInput.addEventListener('input', () => {
        localStorage.setItem('searchQuery', searchInput.value); // Salva o termo de busca
        renderTaskList();
    });

    // Adiciona listener para o checkbox de ocultar/exibir imagens
    toggleImagesCheckbox.addEventListener('change', () => {
        applyImageVisibility();
        // Salva a preferência do usuário no localStorage
        localStorage.setItem('showImages', toggleImagesCheckbox.checked);
    });

    // NOVO: Adiciona listener para o checkbox de ocultar/exibir seção de adicionar tarefa
    toggleAddTaskSectionCheckbox.addEventListener('change', () => {
        applyAddTaskSectionVisibility();
        // Salva a preferência do usuário no localStorage
        localStorage.setItem('showAddTaskSection', toggleAddTaskSectionCheckbox.checked);
    });

    // Listeners para os botões do modal de confirmação de exclusão de tarefa
    confirmDeleteBtn.addEventListener('click', () => {
        if (taskIdToDeleteConfirmed !== null) {
            performDeleteTask(taskIdToDeleteConfirmed); // Chama a função real de exclusão
            taskIdToDeleteConfirmed = null; // Reseta o ID
        }
        confirmationModal.style.display = 'none'; // Esconde o modal
    });

    cancelDeleteBtn.addEventListener('click', () => {
        taskIdToDeleteConfirmed = null; // Reseta o ID
        confirmationModal.style.display = 'none'; // Esconde o modal
    });

    closeButton.addEventListener('click', () => {
        taskIdToDeleteConfirmed = null; // Reseta o ID
        confirmationModal.style.display = 'none';
    });

    // Fecha o modal se clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === confirmationModal) {
            taskIdToDeleteConfirmed = null; // Reseta o ID
            confirmationModal.style.display = 'none';
        }
    });

    // Carrega as tarefas e as preferências salvas ao iniciar a aplicação
    loadTasks();
});