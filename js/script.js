document.addEventListener('DOMContentLoaded', () => {
    // Seletores de elementos HTML para fácil acesso
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskImageInput = document.getElementById('taskImage');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');
    const importBtn = document = document.getElementById('importBtn');

    const addSubtaskBtn = document.getElementById('addSubtaskBtn');
    const subtaskInput = document.getElementById('subtaskInput');
    const subtaskListContainer = document.getElementById('subtaskList');

    const notificationContainer = document.getElementById('notificationContainer');

    // Novos seletores para filtros e ordenação
    const filterStatusSelect = document.getElementById('filterStatus');
    const sortBySelect = document.getElementById('sortBy');

    let currentSubtasks = [];
    let editingTaskId = null;

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
        taskImageInput.value = '';
        currentSubtasks = [];
        renderCurrentSubtasks();
        editingTaskId = null;
        addTaskBtn.innerHTML = '<i class="fas fa-check-circle"></i> Adicionar Tarefa';
        addTaskBtn.classList.remove('save-changes-btn');
    }

    // Função para preencher o formulário para edição de tarefa
    function populateFormForEdit(task) {
        taskTitleInput.value = task.title;
        taskDescriptionInput.value = task.description;
        currentSubtasks = task.subtasks ? [...task.subtasks] : [];
        renderCurrentSubtasks();
        editingTaskId = task.id;
        addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        addTaskBtn.classList.add('save-changes-btn');
        showNotification('Modo de edição ativado!', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Função para aplicar filtro e ordenação antes de renderizar
    function applyFiltersAndSorting(tasks) {
        let filteredTasks = [...tasks]; // Começa com uma cópia das tarefas originais

        // 1. Aplica o filtro de status
        const filterStatus = filterStatusSelect.value;
        if (filterStatus === 'pending') {
            filteredTasks = filteredTasks.filter(task => calculateCompletionPercentage(task) < 100);
        } else if (filterStatus === 'completed') {
            filteredTasks = filteredTasks.filter(task => calculateCompletionPercentage(task) === 100);
        }

        // 2. Aplica a ordenação
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
            }
            return 0;
        });

        return filteredTasks;
    }

    // Função para renderizar a lista completa de tarefas
    function renderTaskList() {
        const allTasks = getTasks(); // Pega todas as tarefas salvas
        const tasksToDisplay = applyFiltersAndSorting(allTasks); // Aplica filtros e ordenação

        taskList.innerHTML = '';
        if (tasksToDisplay.length === 0) {
            taskList.innerHTML = '<p class="no-tasks-message">Nenhuma tarefa encontrada com os filtros e ordenação atuais.</p>';
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

            let subtasksHtml = '';
            if (task.subtasks && task.subtasks.length > 0) {
                subtasksHtml = `
                    <h4><i class="fas fa-tasks"></i> Subtarefas:</h4>
                    <ul class="subtasks-list">
                        ${task.subtasks.map((sub, subIndex) => `
                            <li class="${sub.completed ? 'completed' : ''}">
                                <input type="checkbox" id="subtask-${task.id}-${subIndex}" data-task-id="${task.id}" data-subtask-index="${subIndex}" ${sub.completed ? 'checked' : ''}>
                                <label for="subtask-${task.id}-${subIndex}">${sub.name}</label>
                            </li>
                        `).join('')}
                    </ul>
                `;
            }

            listItem.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description || 'Sem descrição.'}</p>
                <div class="task-status-thermometer">
                    <div class="thermometer-fill" style="width: ${completionPercentage}%;"></div>
                </div>
                ${task.imageUrl ? `<div class="task-image-container"><img src="${task.imageUrl}" alt="Imagem da tarefa" class="task-image"></div>` : ''}
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
                const taskIdToDelete = parseInt(this.dataset.id);
                deleteTask(taskIdToDelete);
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
                const taskId = parseInt(this.dataset.taskId);
                const subtaskIndex = parseInt(this.dataset.subtaskIndex);
                toggleSubtaskCompletion(taskId, subtaskIndex, this.checked);
            });
        });
    }

    // Função para alternar o status de conclusão de uma subtarefa
    function toggleSubtaskCompletion(taskId, subtaskIndex, isCompleted) {
        let tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);

        if (task && task.subtasks && task.subtasks[subtaskIndex]) {
            task.subtasks[subtaskIndex].completed = isCompleted;
            saveTasks(tasks);
            renderTaskList(); // Renderiza a lista novamente para atualizar o termômetro e o estilo da subtarefa
            showNotification(`Subtarefa ${isCompleted ? 'concluída' : 'reaberta'}!`, 'success');
        } else {
            showNotification('Erro ao atualizar subtarefa.', 'error');
        }
    }

    // Função para excluir uma tarefa pelo seu ID
    function deleteTask(id) {
        let tasks = getTasks();
        const initialLength = tasks.length;
        tasks = tasks.filter(task => task.id !== id);
        if (tasks.length < initialLength) {
            saveTasks(tasks);
            renderTaskList(); // Atualiza a lista após exclusão
            showNotification('Tarefa excluída com sucesso!', 'success');
        } else {
            showNotification('Erro ao excluir tarefa. Tarefa não encontrada.', 'error');
        }
    }

    // Carrega as tarefas salvas no LocalStorage e renderiza a lista
    function loadTasks() {
        renderTaskList(); // Chama renderTaskList que já aplica filtros/ordenação
    }

    // --- CHAMADAS INICIAIS E LISTENERS DE EVENTOS ---

    // Carrega as tarefas salvas ao iniciar
    loadTasks();

    // Adiciona listener para o botão de adicionar subtarefa
    addSubtaskBtn.addEventListener('click', () => {
        const subtaskText = subtaskInput.value.trim();
        if (subtaskText) {
            currentSubtasks.push({ name: subtaskText, completed: false });
            renderCurrentSubtasks();
            subtaskInput.value = '';
            subtaskInput.focus();
            showNotification('Subtarefa adicionada.', 'success');
        } else {
            showNotification('Por favor, digite o nome da subtarefa.', 'error');
        }
    });

    // Adiciona listener para o botão de adicionar/salvar tarefa principal
    addTaskBtn.addEventListener('click', () => {
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const imageFile = taskImageInput.files && taskImageInput.files.length > 0 ? taskImageInput.files[0] : null;

        if (!title) {
            showNotification('O título da tarefa é obrigatório.', 'error');
            taskTitleInput.focus();
            return;
        }

        const handleTaskSave = (imageUrl = null) => {
            let tasks = getTasks();
            if (editingTaskId) {
                const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
                if (taskIndex > -1) {
                    tasks[taskIndex].title = title;
                    tasks[taskIndex].description = description;
                    tasks[taskIndex].subtasks = [...currentSubtasks];
                    if (imageUrl !== undefined) { // Se uma nova imagem foi selecionada ou explicitamente definida como null
                        tasks[taskIndex].imageUrl = imageUrl;
                    } else if (!imageFile && tasks[taskIndex].imageUrl) {
                        // Se não foi selecionada nova imagem e já tinha uma, mantém a existente
                    } else if (!imageFile) {
                        // Se não foi selecionada nova imagem e não tinha, garante que não haja imagem
                        tasks[taskIndex].imageUrl = null;
                    }

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
                    imageUrl,
                    subtasks: [...currentSubtasks],
                    createdAt: new Date().toISOString()
                };
                tasks.push(task);
                saveTasks(tasks);
                showNotification('Tarefa adicionada com sucesso!', 'success');
            }
            renderTaskList(); // Renderiza a lista atualizada com filtros e ordenação
            clearForm();
        };

        if (imageFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleTaskSave(reader.result);
            };
            reader.onerror = () => {
                showNotification('Erro ao ler a imagem.', 'error');
                console.error('Erro ao ler a imagem:', reader.error);
                handleTaskSave(undefined); // Tenta salvar a tarefa, mantendo imagem existente se for edição
            };
            reader.readAsDataURL(imageFile);
        } else {
            handleTaskSave(undefined); // 'undefined' significa que não há nova imagem para processar
        }
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

                        // Garante que a tarefa tenha um createdAt e ID único para evitar conflitos na importação
                        importedTask.createdAt = importedTask.createdAt || new Date().toISOString();
                        if (!importedTask.id || existingTasks.some(existingTask => existingTask.id === importedTask.id)) {
                             importedTask.id = Date.now() + Math.floor(Math.random() * 1000); // Gera um novo ID único
                        }

                        newTasks.push(importedTask);
                    });

                    saveTasks([...existingTasks, ...newTasks]); // Adiciona as novas tarefas às existentes
                    renderTaskList(); // Renderiza a lista com as novas tarefas
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
    filterStatusSelect.addEventListener('change', renderTaskList);
    sortBySelect.addEventListener('change', renderTaskList);

    // Se não houver tarefas salvas inicialmente (e não for um erro de carregamento), exibe a mensagem de "nenhuma tarefa"
    if (getTasks().length === 0 && taskList.innerHTML === '') {
        // Esta mensagem é agora tratada dentro de renderTaskList
    }
});