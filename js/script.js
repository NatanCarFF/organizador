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
    const addTaskSection = document.getElementById('addTaskSection'); // Nova referência para a seção de adicionar tarefa

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
    const searchInput = document.getElementById('searchInput');

    // Seletores para o modal de confirmação
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const closeButton = confirmationModal.querySelector('.close-button');

    // Seletores para os novos toggles de seção
    const toggleAddTaskSection = document.getElementById('toggleAddTaskSection');
    const toggleTaskListSection = document.getElementById('toggleTaskListSection');
    const addTaskSectionContent = addTaskSection.querySelector('.section-content');
    const taskListSectionContent = taskListSection.querySelector('.section-content');

    // Variáveis para mensagens de erro
    const taskTitleError = document.getElementById('taskTitleError');
    const taskDescriptionError = document.getElementById('taskDescriptionError');
    const subtaskInputError = document.getElementById('subtaskInputError');

    // Variáveis para imagens
    let selectedFiles = []; // Armazena os File objects para a tarefa atual
    let currentEditingTaskId = null; // Usado para controle de edição

    // Variáveis globais para o modal de confirmação
    let taskIdToDeleteConfirmed = null; // Armazena o ID da tarefa a ser excluída

    // Variáveis para visibilidade de imagens
    const toggleImagesCheckbox = document.getElementById('toggleImages');


    // Carrega tarefas do localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // =========================================================
    // Funções de Utilidade
    // =========================================================

    /**
     * Exibe uma notificação para o usuário.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - O tipo de notificação ('success', 'error', 'info').
     */
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`; // Ícone padrão
        if (type === 'success') {
            notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        } else if (type === 'error') {
            notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        }
        notificationContainer.appendChild(notification);

        // Remove a notificação após alguns segundos
        setTimeout(() => {
            notification.remove();
        }, 3500); // 3.5 segundos (tempo da animação CSS)
    }

    /**
     * Valida os campos do formulário de adicionar/editar tarefa.
     * @returns {boolean} - Retorna true se os campos forem válidos, false caso contrário.
     */
    function validateForm() {
        let isValid = true;

        // Validação do Título
        if (taskTitleInput.value.trim() === '') {
            taskTitleInput.classList.add('input-error');
            taskTitleError.textContent = 'O título da tarefa é obrigatório.';
            isValid = false;
        } else {
            taskTitleInput.classList.remove('input-error');
            taskTitleError.textContent = '';
        }

        // Validação da Descrição (opcional, mas pode ter um limite de caracteres)
        // Por enquanto, apenas remove o erro se houver
        if (taskDescriptionInput.value.trim().length > 500) { // Exemplo de limite
            taskDescriptionInput.classList.add('input-error');
            taskDescriptionError.textContent = 'A descrição não pode exceder 500 caracteres.';
            isValid = false;
        } else {
            taskDescriptionInput.classList.remove('input-error');
            taskDescriptionError.textContent = '';
        }

        return isValid;
    }

    /**
     * Valida o campo de input de subtarefa.
     * @returns {boolean} - Retorna true se a subtarefa for válida, false caso contrário.
     */
    function validateSubtaskInput() {
        if (subtaskInput.value.trim() === '') {
            subtaskInput.classList.add('input-error');
            subtaskInputError.textContent = 'O nome da subtarefa não pode ser vazio.';
            return false;
        } else {
            subtaskInput.classList.remove('input-error');
            subtaskInputError.textContent = '';
            return true;
        }
    }

    /**
     * Limpa o formulário de adição/edição de tarefa.
     */
    function clearForm() {
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        taskPriorityInput.value = 'medium';
        taskDueDateInput.value = '';
        taskImagesInput.value = ''; // Limpa o input de arquivo
        imagePreviewContainer.innerHTML = ''; // Limpa o preview das imagens
        imagePreviewContainer.style.display = 'none'; // Esconde o contêiner de preview

        selectedFiles = []; // Limpa os arquivos selecionados
        subtaskListContainer.innerHTML = ''; // Limpa as subtarefas
        subtaskInput.value = ''; // Limpa o input de subtarefa

        // Remove quaisquer mensagens de erro e classes de erro
        taskTitleInput.classList.remove('input-error');
        taskTitleError.textContent = '';
        taskDescriptionInput.classList.remove('input-error');
        taskDescriptionError.textContent = '';
        subtaskInput.classList.remove('input-error');
        subtaskInputError.textContent = '';

        // Reseta o botão para "Adicionar Tarefa"
        addTaskBtn.textContent = 'Adicionar Tarefa';
        addTaskBtn.innerHTML = '<i class="fas fa-check-circle"></i> Adicionar Tarefa';
        addTaskBtn.classList.remove('save-changes-btn');
        currentEditingTaskId = null; // Reseta o ID da tarefa em edição
    }

    /**
     * Salva as tarefas no localStorage.
     */
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    /**
     * Gera um ID único para tarefas e subtarefas.
     * @returns {string} - Um ID único.
     */
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Converte um objeto File para Base64.
     * @param {File} file - O objeto File a ser convertido.
     * @returns {Promise<string>} - Uma Promise que resolve com a string Base64 da imagem.
     */
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    /**
     * Cria e exibe o preview das imagens selecionadas.
     */
    function displayImagePreviews() {
        imagePreviewContainer.innerHTML = ''; // Limpa previews existentes
        if (selectedFiles.length > 0) {
            imagePreviewContainer.style.display = 'flex'; // Mostra o contêiner
            selectedFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.classList.add('image-preview-item');

                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = `Preview da Imagem ${index + 1}`;

                    const removeBtn = document.createElement('button');
                    removeBtn.classList.add('remove-image-preview-btn');
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>'; // Ícone 'x'
                    removeBtn.addEventListener('click', () => {
                        selectedFiles.splice(index, 1); // Remove o arquivo do array
                        displayImagePreviews(); // Atualiza o preview
                    });

                    previewItem.appendChild(img);
                    previewItem.appendChild(removeBtn);
                    imagePreviewContainer.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            });
        } else {
            imagePreviewContainer.style.display = 'none'; // Esconde se não houver imagens
        }
    }

    /**
     * Aplica a visibilidade das imagens na lista de tarefas baseada no checkbox.
     */
    function applyImageVisibility() {
        if (toggleImagesCheckbox.checked) {
            taskList.classList.remove('hide-images');
        } else {
            taskList.classList.add('hide-images');
        }
    }

    /**
     * Alterna a visibilidade de uma seção.
     * @param {HTMLElement} sectionContentElement - O elemento .section-content a ser ocultado/exibido.
     * @param {boolean} isChecked - O estado do checkbox (true para exibir, false para ocultar).
     * @param {HTMLLabelElement} labelElement - O label do checkbox para atualizar o texto.
     */
    function toggleSectionVisibility(sectionContentElement, isChecked, labelElement) {
        if (isChecked) {
            sectionContentElement.classList.remove('hidden');
            if (labelElement) {
                labelElement.innerHTML = '<i class="fas fa-eye"></i> Exibir Formulário'; // ou Exibir Lista
            }
        } else {
            sectionContentElement.classList.add('hidden');
            if (labelElement) {
                labelElement.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Formulário'; // ou Ocultar Lista
            }
        }
        // Salvar a preferência do usuário no localStorage
        localStorage.setItem(sectionContentElement.parentElement.id + 'Visibility', isChecked);
    }

    /**
     * Carrega as preferências de visibilidade das seções do localStorage.
     */
    function loadSectionVisibilityPreferences() {
        const addTaskVisibility = localStorage.getItem('addTaskSectionVisibility');
        const taskListVisibility = localStorage.getItem('taskListSectionVisibility');

        // Padrão: visível se não houver preferência salva
        const initialAddTaskVisible = addTaskVisibility === null ? true : JSON.parse(addTaskVisibility);
        const initialTaskListVisible = taskListVisibility === null ? true : JSON.parse(taskListVisibility);

        toggleAddTaskSection.checked = initialAddTaskVisible;
        toggleTaskListSection.checked = initialTaskListVisible;

        toggleSectionVisibility(addTaskSectionContent, initialAddTaskVisible, toggleAddTaskSection.nextElementSibling);
        toggleSectionVisibility(taskListSectionContent, initialTaskListVisible, toggleTaskListSection.nextElementSibling);
    }


    // =========================================================
    // Funções de Tarefas (CRUD)
    // =========================================================

    /**
     * Adiciona ou atualiza uma tarefa no array de tarefas.
     */
    async function addOrUpdateTask() {
        if (!validateForm()) {
            showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const priority = taskPriorityInput.value;
        const dueDate = taskDueDateInput.value;

        // Converter imagens selecionadas para Base64
        const imagesBase64 = [];
        for (const file of selectedFiles) {
            imagesBase64.push(await fileToBase64(file));
        }

        // Captura as subtarefas do DOM
        const subtasks = [];
        subtaskListContainer.querySelectorAll('li').forEach(li => {
            const checkbox = li.querySelector('input[type="checkbox"]');
            const label = li.querySelector('label');
            if (checkbox && label) {
                subtasks.push({
                    id: li.dataset.id,
                    text: label.textContent,
                    completed: checkbox.checked
                });
            }
        });


        if (currentEditingTaskId) {
            // Atualizar tarefa existente
            const taskIndex = tasks.findIndex(t => t.id === currentEditingTaskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].title = title;
                tasks[taskIndex].description = description;
                tasks[taskIndex].priority = priority;
                tasks[taskIndex].dueDate = dueDate;
                tasks[taskIndex].images = imagesBase64; // Atualiza as imagens
                tasks[taskIndex].subtasks = subtasks; // Atualiza as subtarefas
                tasks[taskIndex].updatedAt = new Date().toISOString(); // Atualiza data de modificação
                showNotification('Tarefa atualizada com sucesso!', 'success');
            }
        } else {
            // Adicionar nova tarefa
            const newTask = {
                id: generateUniqueId(),
                title,
                description,
                priority,
                dueDate,
                createdAt: new Date().toISOString(), // Data de criação
                completed: false, // Inicialmente não completa
                images: imagesBase64, // Adiciona imagens
                subtasks: subtasks // Adiciona subtarefas
            };
            tasks.push(newTask);
            showNotification('Tarefa adicionada com sucesso!', 'success');
        }

        saveTasks();
        renderTaskList();
        clearForm();
    }

    /**
     * Renderiza a lista de tarefas na interface.
     */
    function renderTaskList() {
        // Obter valores de filtro e ordenação
        const filterStatus = filterStatusSelect.value;
        const sortBy = sortBySelect.value;
        const filterPriority = filterPrioritySelect.value;
        const searchTerm = searchInput.value.toLowerCase();

        // Aplicar filtros e busca
        let filteredTasks = tasks.filter(task => {
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'completed' && task.subtasks.every(sub => sub.completed) && task.subtasks.length > 0) ||
                (filterStatus === 'pending' && !(task.subtasks.every(sub => sub.completed) && task.subtasks.length > 0));

            const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

            const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                                  task.description.toLowerCase().includes(searchTerm);

            return matchesStatus && matchesPriority && matchesSearch;
        });

        // Aplicar ordenação
        filteredTasks.sort((a, b) => {
            if (sortBy === 'createdAt') {
                return new Date(b.createdAt) - new Date(a.createdAt); // Mais recentes primeiro
            } else if (sortBy === 'titleAsc') {
                return a.title.localeCompare(b.title);
            } else if (sortBy === 'titleDesc') {
                return b.title.localeCompare(a.title);
            } else if (sortBy === 'completionAsc') {
                const aComplete = a.subtasks.length > 0 ? a.subtasks.filter(s => s.completed).length / a.subtasks.length : 0;
                const bComplete = b.subtasks.length > 0 ? b.subtasks.filter(s => s.completed).length / b.subtasks.length : 0;
                return aComplete - bComplete;
            } else if (sortBy === 'completionDesc') {
                const aComplete = a.subtasks.length > 0 ? a.subtasks.filter(s => s.completed).length / a.subtasks.length : 0;
                const bComplete = b.subtasks.length > 0 ? b.subtasks.filter(s => s.completed).length / b.subtasks.length : 0;
                return bComplete - aComplete;
            } else if (sortBy === 'dueDateAsc') {
                // Tarefas sem data de vencimento vão para o final
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (sortBy === 'dueDateDesc') {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(b.dueDate) - new Date(a.dueDate);
            }
            return 0;
        });


        taskList.innerHTML = ''; // Limpa a lista existente

        if (filteredTasks.length === 0) {
            const noTasksMessage = document.createElement('li');
            noTasksMessage.classList.add('no-tasks-message');
            noTasksMessage.textContent = 'Nenhuma tarefa encontrada. Adicione uma nova tarefa!';
            taskList.appendChild(noTasksMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.classList.add('task-item');
            taskItem.dataset.id = task.id; // Armazena o ID no dataset

            // Adiciona classe de prioridade para estilização
            taskItem.classList.add(`priority-${task.priority}`);

            // Verifica o status de conclusão da tarefa
            const allSubtasksCompleted = task.subtasks.length > 0 && task.subtasks.every(sub => sub.completed);
            if (allSubtasksCompleted) {
                taskItem.classList.add('task-complete');
            }

            // Lógica para Data de Vencimento
            let dueDateHtml = '';
            if (task.dueDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Zera a hora para comparação
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);

                let dueDateClass = '';
                let dueDateText = `Vencimento: ${new Date(task.dueDate).toLocaleDateString('pt-BR')}`;

                if (dueDate < today && !allSubtasksCompleted) {
                    dueDateClass = 'overdue';
                    dueDateText += ' (Vencida!)';
                    taskItem.classList.add('overdue');
                } else if (dueDate.toDateString() === today.toDateString() && !allSubtasksCompleted) {
                    dueDateClass = 'due-today';
                    dueDateText += ' (Vence Hoje!)';
                    taskItem.classList.add('due-today');
                } else {
                    // Calcula a diferença em dias para 'due-soon' (vence em breve, ex: próximos 3 dias)
                    const timeDiff = dueDate.getTime() - today.getTime();
                    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    if (dayDiff > 0 && dayDiff <= 3 && !allSubtasksCompleted) {
                        dueDateClass = 'due-soon';
                        dueDateText += ` (Vence em ${dayDiff} dia${dayDiff > 1 ? 's' : ''})`;
                        taskItem.classList.add('due-soon');
                    }
                }
                dueDateHtml = `<p class="${dueDateClass}"><strong><i class="fas fa-calendar-alt"></i> ${dueDateText}</strong></p>`;
            }

            // HTML para imagens
            let imagesHtml = '';
            if (task.images && task.images.length > 0) {
                imagesHtml = `<div class="multiple-images-display task-image-container">`;
                task.images.forEach(imgSrc => {
                    imagesHtml += `<img src="${imgSrc}" alt="Imagem da Tarefa" class="task-image">`;
                });
                imagesHtml += `</div>`;
            }

            // HTML para subtarefas
            let subtasksHtml = '';
            if (task.subtasks && task.subtasks.length > 0) {
                subtasksHtml = `<h4><i class="fas fa-tasks"></i> Subtarefas:</h4><ul class="subtasks-list">`;
                task.subtasks.forEach(sub => {
                    subtasksHtml += `
                        <li data-id="${sub.id}" class="${sub.completed ? 'completed' : ''}">
                            <div>
                                <input type="checkbox" ${sub.completed ? 'checked' : ''} data-task-id="${task.id}" data-subtask-id="${sub.id}">
                                <label>${sub.text}</label>
                            </div>
                            <div class="subtask-actions">
                                <button class="edit-subtask-btn" data-task-id="${task.id}" data-subtask-id="${sub.id}"><i class="fas fa-edit"></i></button>
                                <button class="remove-subtask-btn" data-task-id="${task.id}" data-subtask-id="${sub.id}"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </li>
                    `;
                });
                subtasksHtml += `</ul>`;
            } else {
                subtasksHtml = `<p class="no-subtasks-message">Nenhuma subtarefa.</p>`;
            }

            // Calcula o progresso do termômetro
            const completedSubtasksCount = task.subtasks.filter(sub => sub.completed).length;
            const totalSubtasksCount = task.subtasks.length;
            const completionPercentage = totalSubtasksCount === 0 ? 0 : (completedSubtasksCount / totalSubtasksCount) * 100;

            taskItem.innerHTML = `
                <div class="task-actions">
                    <button class="edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="delete-btn" data-id="${task.id}"><i class="fas fa-trash-alt"></i> Excluir</button>
                </div>
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <p><strong><i class="fas fa-flag"></i> Prioridade:</strong> <span class="priority-label ${task.priority}">${task.priority === 'low' ? 'Baixa' : task.priority === 'medium' ? 'Média' : 'Alta'}</span></p>
                ${dueDateHtml}
                <p><strong><i class="fas fa-clock"></i> Criado em:</strong> ${new Date(task.createdAt).toLocaleDateString('pt-BR')}</p>
                <p><strong><i class="fas fa-sync-alt"></i> Progresso:</strong> ${completionPercentage.toFixed(0)}%</p>
                <div class="task-status-thermometer">
                    <div class="thermometer-fill" style="width: ${completionPercentage}%;"></div>
                </div>
                ${imagesHtml}
                ${subtasksHtml}
            `;
            taskList.appendChild(taskItem);
        });

        // Aplica a visibilidade das imagens após renderizar a lista
        applyImageVisibility();
        saveTasks(); // Salva as tarefas após a renderização (para garantir consistência)
        addEventListenersToTaskItems(); // Adiciona listeners dinamicamente
    }

    /**
     * Adiciona listeners de evento para os botões e checkboxes dentro dos itens da tarefa.
     * Isso é necessário porque os itens são renderizados dinamicamente.
     */
    function addEventListenersToTaskItems() {
        // Listeners para checkboxes de subtarefas
        taskList.querySelectorAll('.subtasks-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.dataset.taskId;
                const subtaskId = e.target.dataset.subtaskId;
                toggleSubtaskCompletion(taskId, subtaskId, e.target.checked);
            });
        });

        // Listeners para botões de remoção de subtarefas
        taskList.querySelectorAll('.remove-subtask-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.target.dataset.taskId || e.target.closest('button').dataset.taskId;
                const subtaskId = e.target.dataset.subtaskId || e.target.closest('button').dataset.subtaskId;
                if (confirm('Tem certeza que deseja remover esta subtarefa?')) {
                    removeSubtask(taskId, subtaskId);
                }
            });
        });

        // Listeners para botões de edição de subtarefas
        taskList.querySelectorAll('.edit-subtask-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.target.dataset.taskId || e.target.closest('button').dataset.taskId;
                const subtaskId = e.target.dataset.subtaskId || e.target.closest('button').dataset.subtaskId;
                editSubtask(taskId, subtaskId);
            });
        });

        // Listeners para botões de editar tarefa
        taskList.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.target.dataset.id || e.target.closest('button').dataset.id;
                editTask(taskId);
            });
        });

        // Listeners para botões de excluir tarefa
        taskList.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.target.dataset.id || e.target.closest('button').dataset.id;
                showConfirmationModal(taskId); // Mostra o modal em vez de excluir diretamente
            });
        });
    }

    /**
     * Alterna o estado de conclusão de uma subtarefa.
     * @param {string} taskId - ID da tarefa pai.
     * @param {string} subtaskId - ID da subtarefa.
     * @param {boolean} isCompleted - Novo estado de conclusão.
     */
    function toggleSubtaskCompletion(taskId, subtaskId, isCompleted) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const subtask = task.subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.completed = isCompleted;
                showNotification('Subtarefa atualizada!', 'info');
                renderTaskList(); // Re-renderiza para atualizar o progresso e classes
            }
        }
    }

    /**
     * Adiciona uma nova subtarefa ao formulário.
     */
    function addSubtaskToForm() {
        if (!validateSubtaskInput()) {
            return;
        }

        const subtaskText = subtaskInput.value.trim();
        const subtaskId = generateUniqueId();

        const li = document.createElement('li');
        li.dataset.id = subtaskId;
        li.innerHTML = `
            <div>
                <input type="checkbox">
                <label>${subtaskText}</label>
            </div>
            <div class="subtask-actions">
                <button class="edit-subtask-btn"><i class="fas fa-edit"></i></button>
                <button class="remove-subtask-btn"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        subtaskListContainer.appendChild(li);

        // Adiciona listeners para os botões da nova subtarefa
        li.querySelector('.remove-subtask-btn').addEventListener('click', (e) => {
            if (confirm('Tem certeza que deseja remover esta subtarefa?')) {
                e.target.closest('li').remove();
                showNotification('Subtarefa removida do formulário.', 'info');
            }
        });

        li.querySelector('.edit-subtask-btn').addEventListener('click', (e) => {
            const currentLi = e.target.closest('li');
            editSubtaskInForm(currentLi);
        });

        subtaskInput.value = ''; // Limpa o input
        showNotification('Subtarefa adicionada ao formulário.', 'success');
    }

    /**
     * Edita uma subtarefa diretamente na lista de tarefas ou no formulário de adição/edição.
     * @param {string} taskId - O ID da tarefa pai (se estiver na lista de tarefas).
     * @param {string} subtaskId - O ID da subtarefa a ser editada.
     */
    function editSubtask(taskId, subtaskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (!subtask) return;

        const subtaskLi = taskList.querySelector(`li[data-id="${subtaskId}"]`);
        if (!subtaskLi) return; // Se não encontrar, algo está errado

        const label = subtaskLi.querySelector('label');
        const currentText = label.textContent;

        label.style.display = 'none'; // Oculta o label
        const checkbox = subtaskLi.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.style.display = 'none'; // Oculta o checkbox durante a edição

        const input = document.createElement('input');
        input.type = 'text';
        input.classList.add('subtask-edit-input');
        input.value = currentText;
        subtaskLi.querySelector('div').prepend(input); // Adiciona o input antes do label

        const actionsDiv = subtaskLi.querySelector('.subtask-actions');
        actionsDiv.innerHTML = `
            <button class="save-subtask-btn"><i class="fas fa-save"></i></button>
            <button class="cancel-subtask-btn"><i class="fas fa-times"></i></button>
        `;

        const saveBtn = actionsDiv.querySelector('.save-subtask-btn');
        const cancelBtn = actionsDiv.querySelector('.cancel-subtask-btn');

        saveBtn.addEventListener('click', () => {
            const newText = input.value.trim();
            if (newText) {
                subtask.text = newText;
                showNotification('Subtarefa atualizada com sucesso!', 'success');
                renderTaskList();
            } else {
                showNotification('O nome da subtarefa não pode ser vazio.', 'error');
                input.focus(); // Mantém o foco no input
            }
        });

        cancelBtn.addEventListener('click', () => {
            showNotification('Edição de subtarefa cancelada.', 'info');
            renderTaskList(); // Re-renderiza para restaurar o estado original
        });

        input.focus();
        input.select();
    }

    /**
     * Edita uma subtarefa diretamente no formulário de adição/edição de tarefa.
     * Esta função é diferente da `editSubtask` acima porque opera no `subtaskListContainer` do formulário,
     * não na lista de tarefas principal.
     * @param {HTMLElement} li - O elemento `li` da subtarefa no formulário.
     */
    function editSubtaskInForm(li) {
        const label = li.querySelector('label');
        const currentText = label.textContent;

        // Oculta o label e o checkbox (se houver)
        label.style.display = 'none';
        const checkbox = li.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.style.display = 'none';

        const input = document.createElement('input');
        input.type = 'text';
        input.classList.add('subtask-edit-input');
        input.value = currentText;
        li.querySelector('div').prepend(input); // Adiciona o input antes do label/checkbox

        // Substitui os botões de ação
        const actionsDiv = li.querySelector('.subtask-actions');
        actionsDiv.innerHTML = `
            <button class="save-subtask-btn"><i class="fas fa-save"></i></button>
            <button class="cancel-subtask-btn"><i class="fas fa-times"></i></button>
        `;

        const saveBtn = actionsDiv.querySelector('.save-subtask-btn');
        const cancelBtn = actionsDiv.querySelector('.cancel-subtask-btn');

        saveBtn.addEventListener('click', () => {
            const newText = input.value.trim();
            if (newText) {
                label.textContent = newText; // Atualiza o texto do label
                // Restaura o label e checkbox, remove o input e os botões de edição
                label.style.display = 'inline';
                if (checkbox) checkbox.style.display = 'inline';
                input.remove();
                actionsDiv.innerHTML = `
                    <button class="edit-subtask-btn"><i class="fas fa-edit"></i></button>
                    <button class="remove-subtask-btn"><i class="fas fa-trash-alt"></i></button>
                `;
                // Re-adiciona os listeners para os botões originais
                li.querySelector('.remove-subtask-btn').addEventListener('click', (e) => {
                    if (confirm('Tem certeza que deseja remover esta subtarefa?')) {
                        e.target.closest('li').remove();
                        showNotification('Subtarefa removida do formulário.', 'info');
                    }
                });
                li.querySelector('.edit-subtask-btn').addEventListener('click', (e) => {
                    editSubtaskInForm(e.target.closest('li'));
                });
                showNotification('Subtarefa do formulário atualizada!', 'success');
            } else {
                showNotification('O nome da subtarefa não pode ser vazio.', 'error');
                input.focus();
            }
        });

        cancelBtn.addEventListener('click', () => {
            // Restaura o label e checkbox, remove o input e os botões de edição
            label.style.display = 'inline';
            if (checkbox) checkbox.style.display = 'inline';
            input.remove();
            actionsDiv.innerHTML = `
                <button class="edit-subtask-btn"><i class="fas fa-edit"></i></button>
                <button class="remove-subtask-btn"><i class="fas fa-trash-alt"></i></button>
            `;
            // Re-adiciona os listeners para os botões originais
            li.querySelector('.remove-subtask-btn').addEventListener('click', (e) => {
                if (confirm('Tem certeza que deseja remover esta subtarefa?')) {
                    e.target.closest('li').remove();
                    showNotification('Subtarefa removida do formulário.', 'info');
                }
            });
            li.querySelector('.edit-subtask-btn').addEventListener('click', (e) => {
                editSubtaskInForm(e.target.closest('li'));
            });
            showNotification('Edição de subtarefa do formulário cancelada.', 'info');
        });

        input.focus();
        input.select();
    }


    /**
     * Remove uma subtarefa do array de tarefas.
     * @param {string} taskId - ID da tarefa pai.
     * @param {string} subtaskId - ID da subtarefa a ser removida.
     */
    function removeSubtask(taskId, subtaskId) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].subtasks = tasks[taskIndex].subtasks.filter(sub => sub.id !== subtaskId);
            showNotification('Subtarefa removida com sucesso!', 'success');
            renderTaskList(); // Re-renderiza a lista de tarefas
        }
    }


    /**
     * Preenche o formulário com os dados de uma tarefa para edição.
     * @param {string} taskId - O ID da tarefa a ser editada.
     */
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            currentEditingTaskId = taskId; // Define o ID da tarefa em edição
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description;
            taskPriorityInput.value = task.priority;
            taskDueDateInput.value = task.dueDate;

            // Limpa e exibe as imagens existentes
            imagePreviewContainer.innerHTML = '';
            selectedFiles = []; // Reseta selectedFiles para as imagens da tarefa
            if (task.images && task.images.length > 0) {
                imagePreviewContainer.style.display = 'flex'; // Mostra o contêiner
                task.images.forEach((imgSrc, index) => {
                    const previewItem = document.createElement('div');
                    previewItem.classList.add('image-preview-item');

                    const img = document.createElement('img');
                    img.src = imgSrc;
                    img.alt = `Imagem da Tarefa ${index + 1}`;

                    const removeBtn = document.createElement('button');
                    removeBtn.classList.add('remove-image-preview-btn');
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    removeBtn.addEventListener('click', () => {
                        // Remove a imagem do array de imagens da tarefa
                        task.images.splice(index, 1);
                        showNotification('Imagem removida!', 'info');
                        editTask(taskId); // Re-renderiza o formulário de edição para refletir a remoção
                        saveTasks(); // Salva a alteração imediatamente
                    });

                    previewItem.appendChild(img);
                    previewItem.appendChild(removeBtn);
                    imagePreviewContainer.appendChild(previewItem);
                    // Não adicionamos ao selectedFiles aqui, pois são imagens já salvas
                    // selectedFiles é apenas para novas imagens a serem adicionadas ou sobrescritas
                });
                // É crucial clonar as imagens existentes para 'selectedFiles' para que elas sejam tratadas como "arquivos" durante a re-salvamento
                // No entanto, para fins práticos e de UX, é melhor que 'selectedFiles' contenha APENAS novas seleções.
                // As imagens existentes serão tratadas separadamente e combinadas no salvamento.
                // Aqui, apenas copiamos os src para um array temporário para gerenciar a remoção.
                // selectedFiles = task.images.map(src => new File([], src.substring(src.lastIndexOf('/') + 1), {type: 'image/png'})); // Isso é complexo e não é a abordagem correta.
                // A abordagem correta é deixar `selectedFiles` para novas seleções e, ao salvar, combinar `task.images` e `selectedFiles`.
                // Por agora, `selectedFiles` fica vazio para permitir novos uploads, e as imagens existentes são gerenciadas acima.
            } else {
                imagePreviewContainer.style.display = 'none';
            }


            // Preenche as subtarefas
            subtaskListContainer.innerHTML = ''; // Limpa as subtarefas atuais no formulário
            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach(sub => {
                    const li = document.createElement('li');
                    li.dataset.id = sub.id; // Mantém o ID original da subtarefa
                    li.innerHTML = `
                        <div>
                            <input type="checkbox" ${sub.completed ? 'checked' : ''}>
                            <label>${sub.text}</label>
                        </div>
                        <div class="subtask-actions">
                            <button class="edit-subtask-btn"><i class="fas fa-edit"></i></button>
                            <button class="remove-subtask-btn"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    `;
                    subtaskListContainer.appendChild(li);

                    // Adiciona listeners para os botões da subtarefa no formulário de edição
                    li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                        // Isso afeta APENAS o estado do checkbox no formulário, não no objeto da tarefa ainda.
                        // O estado final será salvo quando a tarefa principal for salva.
                        if (e.target.checked) {
                            e.target.closest('li').classList.add('completed');
                        } else {
                            e.target.closest('li').classList.remove('completed');
                        }
                    });

                    li.querySelector('.remove-subtask-btn').addEventListener('click', (e) => {
                        if (confirm('Tem certeza que deseja remover esta subtarefa do formulário?')) {
                            e.target.closest('li').remove();
                            showNotification('Subtarefa removida do formulário de edição.', 'info');
                        }
                    });

                    li.querySelector('.edit-subtask-btn').addEventListener('click', (e) => {
                        editSubtaskInForm(e.target.closest('li'));
                    });
                });
            }

            // Altera o texto do botão e a classe
            addTaskBtn.textContent = 'Salvar Alterações';
            addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
            addTaskBtn.classList.add('save-changes-btn');

            // Rola para a seção de adicionar tarefa
            addTaskSection.scrollIntoView({ behavior: 'smooth' });
            taskTitleInput.focus();
        }
    }

    /**
     * Exibe o modal de confirmação de exclusão.
     * @param {string} taskId - O ID da tarefa a ser excluída.
     */
    function showConfirmationModal(taskId) {
        taskIdToDeleteConfirmed = taskId; // Armazena o ID da tarefa para exclusão
        confirmationModal.style.display = 'flex'; // Exibe o modal
    }

    /**
     * Executa a exclusão da tarefa após a confirmação.
     * @param {string} taskId - O ID da tarefa a ser excluída.
     */
    function performDeleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTaskList();
        showNotification('Tarefa excluída com sucesso!', 'success');
        clearForm(); // Limpa o formulário caso a tarefa excluída estivesse sendo editada
    }

    // =========================================================
    // Funções de Importação/Exportação
    // =========================================================

    /**
     * Exporta as tarefas para um arquivo JSON.
     */
    function exportTasks() {
        if (tasks.length === 0) {
            showNotification('Não há tarefas para exportar.', 'info');
            return;
        }
        const dataStr = JSON.stringify(tasks, null, 2); // Formata com 2 espaços
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tarefas.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Libera o objeto URL
        showNotification('Tarefas exportadas com sucesso!', 'success');
    }

    /**
     * Importa tarefas de um arquivo JSON.
     */
    function importTasks() {
        const file = importFile.files[0];
        if (!file) {
            showNotification('Por favor, selecione um arquivo JSON para importar.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    // Mescla as tarefas importadas com as existentes, evitando duplicatas por ID
                    const existingTaskIds = new Set(tasks.map(t => t.id));
                    const newTasks = importedTasks.filter(importedTask => !existingTaskIds.has(importedTask.id));

                    if (newTasks.length > 0) {
                        tasks.push(...newTasks);
                        saveTasks();
                        renderTaskList();
                        showNotification(`${newTasks.length} tarefa(s) importada(s) com sucesso!`, 'success');
                    } else {
                        showNotification('Nenhuma nova tarefa foi encontrada no arquivo para importar.', 'info');
                    }
                } else {
                    showNotification('O arquivo JSON selecionado não contém um formato de tarefas válido.', 'error');
                }
            } catch (error) {
                console.error('Erro ao importar tarefas:', error);
                showNotification('Erro ao ler ou processar o arquivo JSON. Certifique-se de que é um JSON válido.', 'error');
            } finally {
                importFile.value = ''; // Limpa o input de arquivo após a importação
            }
        };
        reader.onerror = () => {
            showNotification('Erro ao ler o arquivo.', 'error');
        };
        reader.readAsText(file);
    }

    // =========================================================
    // Event Listeners
    // =========================================================

    // Listener para adicionar/atualizar tarefa
    addTaskBtn.addEventListener('click', addOrUpdateTask);

    // Listener para o input de imagens (preview)
    taskImagesInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const maxImages = 5;

        // Limita o número total de arquivos (arquivos já existentes + novos)
        if (selectedFiles.length + files.length > maxImages) {
            showNotification(`Você pode anexar no máximo ${maxImages} imagens.`, 'error');
            // Limpa o input para impedir re-seleção acidental
            e.target.value = '';
            return;
        }
        
        selectedFiles.push(...files); // Adiciona os novos arquivos
        displayImagePreviews(); // Atualiza o preview
    });


    // Listener para adicionar subtarefa
    addSubtaskBtn.addEventListener('click', addSubtaskToForm);
    subtaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Impede a quebra de linha no input e o envio do formulário
            addSubtaskToForm();
        }
    });

    // Listeners para filtros, ordenação e busca
    filterStatusSelect.addEventListener('change', renderTaskList);
    sortBySelect.addEventListener('change', renderTaskList);
    filterPrioritySelect.addEventListener('change', renderTaskList);
    searchInput.addEventListener('input', () => { // Usar 'input' para busca em tempo real
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

    // Listeners para os novos checkboxes de toggle de seção
    toggleAddTaskSection.addEventListener('change', (e) => {
        toggleSectionVisibility(addTaskSectionContent, e.target.checked, toggleAddTaskSection.nextElementSibling);
    });

    toggleTaskListSection.addEventListener('change', (e) => {
        toggleSectionVisibility(taskListSectionContent, e.target.checked, toggleTaskListSection.nextElementSibling);
    });

    // Listeners para importação/exportação
    exportBtn.addEventListener('click', exportTasks);
    importBtn.addEventListener('click', importTasks);


    // =========================================================
    // Inicialização da Aplicação
    // =========================================================

    // Carrega e aplica as preferências de visibilidade das seções
    loadSectionVisibilityPreferences();

    // Carrega a preferência de exibição de imagens do localStorage ao iniciar
    const showImagesPreference = localStorage.getItem('showImages');
    if (showImagesPreference !== null) {
        toggleImagesCheckbox.checked = JSON.parse(showImagesPreference);
    }
    applyImageVisibility(); // Aplica a visibilidade inicial das imagens

    // Carrega o termo de busca salvo no localStorage ao iniciar
    const savedSearchQuery = localStorage.getItem('searchQuery');
    if (savedSearchQuery) {
        searchInput.value = savedSearchQuery;
    }

    // Renderiza a lista de tarefas ao carregar a página
    renderTaskList();
});