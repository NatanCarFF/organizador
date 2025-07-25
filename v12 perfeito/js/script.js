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
            filteredTasks = filteredTasks.filter(task => calculateCompletionPercentage(task) < 100);
        } else if (filterStatus === 'completed') {
            filteredTasks = filteredTasks.filter(task => calculateCompletionPercentage(task) === 100 && task.subtasks.length > 0);
        }

        // 2. Aplica o filtro de prioridade
        const filterPriority = filterPrioritySelect.value;
        if (filterPriority !== 'all') {
            filteredTasks = filteredTasks.filter(task => (task.priority || 'medium') === filterPriority);
        }

        // 3. Aplica a ordenação
        const sortBy = sortBySelect.value;
        filteredTasks.sort((a, b) => {
            if (sortBy === 'createdAt') {
                return new Date(a.createdAt) - new Date(b.createdAt);
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
        return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', options); // Adiciona T00:00:00 para evitar problemas de fuso horário
    }

    // Função para renderizar a lista completa de tarefas (ATUALIZADA para exibir múltiplas imagens)
    function renderTaskList() {
        const allTasks = getTasks();
        const tasksToDisplay = applyFiltersAndSorting(allTasks);

        taskList.innerHTML = '';
        if (tasksToDisplay.length === 0) {
            taskList.innerHTML = '<p class="no-tasks-message">Nenhuma tarefa encontrada com os filtros, busca e ordenação atuais.</p>';
            return;
        }

        tasksToDisplay.forEach(task => {
            const listItem = document.createElement('li');
            listItem.classList.add('task-item');
            listItem.setAttribute('data-id', task.id);

            const completionPercentage = calculateCompletionPercentage(task);
            const isTaskComplete = completionPercentage === 100 && task.subtasks.length > 0;
            if (isTaskComplete) {
                listItem.classList.add('task-complete');
            } else {
                listItem.classList.remove('task-complete');
            }

            // Adiciona classe de prioridade
            listItem.classList.add(`priority-${task.priority || 'medium'}`);

            // Adiciona classe de status de vencimento
            const dueDateStatus = getDueDateStatus(task.dueDate);
            if (dueDateStatus) {
                listItem.classList.add(dueDateStatus);
            }

            // ATUALIZADO: Renderização de múltiplas imagens
            let imagesHtml = '';
            if (task.imageUrls && task.imageUrls.length > 0) {
                const imageElements = task.imageUrls.map(url => `
                    <img src="${url}" alt="Imagem da tarefa" class="task-image">
                `).join('');
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
                <p><strong>Vencimento:</strong> <span class="due-date-text">${formatDate(task.dueDate)}</span></p>
                <div class="task-status-thermometer">
                    <div class="thermometer-fill" style="width: ${completionPercentage}%;"></div>
                </div>
                ${imagesHtml}
                ${subtasksHtml}
                <div class="task-actions">
                    <button type="button" class="edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i> Editar</button>
                    <button type="button" class="delete-btn" data-id="${task.id}"><i class="fas fa-trash-alt"></i> Excluir</button>
                </div>
            `;
            taskList.appendChild(listItem);
        });

        // Adiciona event listeners para os botões de excluir de cada tarefa
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                taskIdToDeleteConfirmed = parseInt(this.dataset.id);
                confirmationModal.style.display = 'flex'; // Mostra o modal
            });
        });

        // Adiciona event listeners para os botões de editar de cada tarefa
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskIdToEdit = parseInt(this.dataset.id);
                const tasks = getTasks();
                const taskToEdit = tasks.find(t => t.id === taskIdToEdit);
                if (taskToEdit) {
                    populateFormForEdit(taskToEdit);
                } else {
                    showNotification('Tarefa não encontrada para edição.', 'error');
                }
            });
        });

        // Adiciona event listeners para os checkboxes das subtarefas
        document.querySelectorAll('.subtasks-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const taskId = parseInt(this.closest('li').dataset.taskId);
                const subtaskIndex = parseInt(this.closest('li').dataset.subtaskIndex);
                toggleSubtaskCompletion(taskId, subtaskIndex, this.checked);
            });
        });

        // Adiciona event listeners para os botões de editar subtarefas
        document.querySelectorAll('.edit-subtask-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const li = this.closest('li');
                const taskId = parseInt(li.dataset.taskId);
                const subtaskIndex = parseInt(li.dataset.subtaskIndex);
                const tasks = getTasks();
                const task = tasks.find(t => t.id === taskId);
                const subtask = task ? task.subtasks[subtaskIndex] : null;

                if (subtask) {
                    const label = li.querySelector('div > label'); // O label é o que exibe o nome
                    const checkbox = li.querySelector('div > input[type="checkbox"]');
                    const originalName = subtask.name;

                    // Cria o input de edição
                    const editInput = document.createElement('input');
                    editInput.type = 'text';
                    editInput.classList.add('subtask-edit-input');
                    editInput.value = originalName;
                    editInput.dataset.originalName = originalName; // Guarda o nome original para 'cancelar'

                    // Esconde o checkbox e o label, mostra o input
                    checkbox.style.display = 'none';
                    label.style.display = 'none';
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
                const editInput = li.querySelector('.subtask-edit-input');
                const originalName = editInput.dataset.originalName; // Recupera o nome original

                const label = li.querySelector('div > label');
                const checkbox = li.querySelector('div > input[type="checkbox"]');

                // Volta o label e checkbox
                label.style.display = 'inline'; // Ou 'flex' dependendo do seu display do label
                checkbox.style.display = 'inline';
                label.textContent = originalName; // Restaura o nome original no label

                // Remove o input
                editInput.remove();

                // Esconde salvar/cancelar, mostra editar
                li.querySelector('.edit-subtask-btn').style.display = 'inline-flex';
                this.style.display = 'none';
                li.querySelector('.save-subtask-btn').style.display = 'none';

                showNotification('Edição de subtarefa cancelada.', 'info');
            });
        });

        // Adiciona event listeners para os botões de remover subtarefas (dentro da lista de tarefas)
        document.querySelectorAll('.task-item .remove-subtask-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const li = this.closest('li');
                const taskId = parseInt(li.dataset.taskId);
                const subtaskIndex = parseInt(li.dataset.subtaskIndex);

                let tasks = getTasks();
                const task = tasks.find(t => t.id === taskId);

                if (task && task.subtasks && task.subtasks[subtaskIndex]) {
                    task.subtasks.splice(subtaskIndex, 1);
                    saveTasks(tasks);
                    renderTaskList(); // Re-renderiza para atualizar a lista e porcentagem
                    showNotification('Subtarefa removida da tarefa principal.', 'success');
                } else {
                    showNotification('Erro ao remover subtarefa.', 'error');
                }
            });
        });

        // Aplica o estado de visibilidade da imagem ao renderizar
        applyImageVisibility();
    }

    // Função para alternar o status de conclusão de uma subtarefa
    function toggleSubtaskCompletion(taskId, subtaskIndex, isCompleted) {
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

        renderTaskList();
        // Define o estado inicial do checkbox baseado na preferência salva ou padrão
        const savedImageVisibility = localStorage.getItem('showImages');
        if (savedImageVisibility === 'false') {
            toggleImagesCheckbox.checked = false;
        } else {
            toggleImagesCheckbox.checked = true; // Padrão é mostrar
        }
        applyImageVisibility(); // Aplica o estado inicial
    }

    // --- CHAMADAS INICIAIS E LISTENERS DE EVENTOS ---

    // Carrega as tarefas salvas ao iniciar
    loadTasks();

    // Listener para o input de imagem para exibir preview (ATUALIZADO)
    taskImagesInput.addEventListener('change', handleImageUpload);

    // Adiciona listener para o botão de adicionar subtarefa
    addSubtaskBtn.addEventListener('click', () => {
        const subtaskText = subtaskInput.value.trim();
        
        // Limpa qualquer erro anterior
        clearError(subtaskInput, subtaskInputError);

        if (!subtaskText) {
            displayError(subtaskInput, subtaskInputError, 'O nome da subtarefa é obrigatório.');
            showNotification('Por favor, digite o nome da subtarefa.', 'error');
            subtaskInput.focus();
            return;
        }
        
        currentSubtasks.push({ name: subtaskText, completed: false });
        renderCurrentSubtasks();
        subtaskInput.value = '';
        subtaskInput.focus();
        showNotification('Subtarefa adicionada.', 'success');
    });

    // Adiciona listener para o botão de adicionar/salvar tarefa principal
    addTaskBtn.addEventListener('click', () => {
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const priority = taskPriorityInput.value;
        const dueDate = taskDueDateInput.value;

        // Limpa erros anteriores
        clearError(taskTitleInput, taskTitleError);
        clearError(taskDescriptionInput, taskDescriptionError); // Mesmo que não obrigatória, limpar é boa prática

        // Validação principal
        if (!title) {
            displayError(taskTitleInput, taskTitleError, 'O título da tarefa é obrigatório.');
            showNotification('O título da tarefa é obrigatório.', 'error');
            taskTitleInput.focus();
            return;
        }

        const handleTaskSave = () => {
            let tasks = getTasks();
            if (editingTaskId) {
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
                const task = {
                    id: Date.now(),
                    title,
                    description,
                    priority,
                    dueDate,
                    imageUrls: [...currentImagesBase64], // ATUALIZADO: Inclui o array de URLs na nova tarefa
                    subtasks: [...currentSubtasks],
                    createdAt: new Date().toISOString()
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

    // Adiciona um listener para o botão de exportar tarefas
    exportBtn.addEventListener('click', () => {
        const tasks = getTasks();
        if (tasks.length === 0) {
            showNotification('Não há tarefas para exportar!', 'error');
            return;
        }
        try {
            const jsonString = JSON.stringify(tasks, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'minhas_tarefas.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            showNotification('Tarefas exportadas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar tarefas:', error);
            showNotification('Erro ao exportar tarefas para JSON.', 'error');
        }
    });

    // Adiciona um listener para o botão de importar tarefas
    importBtn.addEventListener('click', () => {
        const file = importFile.files[0];
        if (file) {
            if (file.type !== 'application/json') {
                showNotification('Por favor, selecione um arquivo JSON válido.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedTasks = JSON.parse(e.target.result);
                    if (!Array.isArray(importedTasks) || importedTasks.some(task => !task.title || !Array.isArray(task.subtasks))) {
                        showNotification('Formato de arquivo JSON inválido ou corrompido. Certifique-se de que o arquivo contém um array de tarefas com títulos e subtarefas.', 'error');
                        return;
                    }

                    let existingTasks = getTasks();
                    const newTasks = [];
                    importedTasks.forEach(importedTask => {
                        if (importedTask.subtasks) {
                            importedTask.subtasks = importedTask.subtasks.map(sub => {
                                if (typeof sub === 'string') {
                                    return { name: sub, completed: false };
                                }
                                return { name: sub.name, completed: sub.completed || false };
                            });
                        } else {
                            importedTask.subtasks = [];
                        }

                        // Garante que a tarefa tenha um createdAt e ID único
                        importedTask.createdAt = importedTask.createdAt || new Date().toISOString();
                        // Garante que a tarefa tenha uma prioridade padrão se ausente
                        importedTask.priority = importedTask.priority || 'medium';
                        // Garante que a tarefa tenha uma data de vencimento se ausente
                        importedTask.dueDate = importedTask.dueDate || ''; 
                        // ATUALIZADO: Garante que a tarefa tenha um array de imagens (mesmo que vazio)
                        importedTask.imageUrls = importedTask.imageUrls || []; 

                        // Verifica se o ID já existe para evitar conflitos ao importar no mesmo ID
                        if (existingTasks.some(existingTask => existingTask.id === importedTask.id)) {
                             importedTask.id = Date.now() + Math.floor(Math.random() * 1000); // Gera um novo ID único
                        }

                        newTasks.push(importedTask);
                    });

                    saveTasks([...existingTasks, ...newTasks]);
                    renderTaskList();
                    showNotification('Tarefas importadas com sucesso!', 'success');
                    importFile.value = '';
                } catch (error) {
                    showNotification('Erro ao processar o arquivo JSON. Certifique-se de que é um JSON válido.', 'error');
                    console.error('Erro de importação:', error);
                }
            };
            reader.onerror = () => {
                showNotification('Erro ao ler o arquivo para importação.', 'error');
                console.error('Erro ao ler o arquivo:', reader.error);
            };
            reader.readAsText(file);
        } else {
            showNotification('Selecione um arquivo JSON para importar.', 'error');
        }
    });

    // Adiciona listeners para os selects de filtro e ordenação
    filterStatusSelect.addEventListener('change', () => {
        localStorage.setItem('filterStatus', filterStatusSelect.value); // Salva o filtro
        renderTaskList();
    });
    sortBySelect.addEventListener('change', () => {
        localStorage.setItem('sortBy', sortBySelect.value); // Salva a ordenação
        renderTaskList();
    });

    // Adiciona listener para o filtro de prioridade
    filterPrioritySelect.addEventListener('change', () => {
        localStorage.setItem('filterPriority', filterPrioritySelect.value); // Salva o filtro de prioridade
        renderTaskList();
    });

    // Adiciona listener para o campo de busca
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

});