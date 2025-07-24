document.addEventListener('DOMContentLoaded', () => {
    // Seletores de elementos HTML para fácil acesso
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskImageInput = document.getElementById('taskImage'); // Input de arquivo para imagem
    const addTaskBtn = document.getElementById('addTaskBtn'); // Botão para adicionar a tarefa principal
    const taskList = document.getElementById('taskList'); // Lista onde as tarefas serão exibidas

    const exportBtn = document.getElementById('exportBtn'); // Botão para exportar tarefas
    const importFile = document.getElementById('importFile'); // Input de arquivo para importar JSON
    const importBtn = document.getElementById('importBtn'); // Botão para importar tarefas

    const addSubtaskBtn = document.getElementById('addSubtaskBtn'); // Botão para adicionar subtarefa temporária
    const subtaskInput = document.getElementById('subtaskInput'); // Input de texto para a subtarefa
    const subtaskListContainer = document.getElementById('subtaskList'); // Lista de subtarefas temporárias

    const notificationContainer = document.getElementById('notificationContainer'); // Novo seletor para o contêiner de notificações

    let currentSubtasks = []; // Array temporário para armazenar subtarefas enquanto a tarefa principal está sendo criada

    // --- FUNÇÕES AUXILIARES ---

    /**
     * Exibe uma notificação na tela.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - O tipo da notificação ('success' ou 'error').
     */
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);

        let iconClass = '';
        if (type === 'success') {
            iconClass = 'fas fa-check-circle'; // Ícone de sucesso
        } else if (type === 'error') {
            iconClass = 'fas fa-exclamation-triangle'; // Ícone de erro
        }

        notification.innerHTML = `<i class="${iconClass}"></i> ${message}`;
        notificationContainer.appendChild(notification);

        // Remove a notificação após um tempo (3 segundos para fadeIn + 3s para fadeOut)
        setTimeout(() => {
            notification.remove();
        }, 3500); // Ajuste o tempo conforme a duração da sua animação (0.5s fadeIn + 3s display + 0.5s fadeOut = 4s total)
    }

    // Função auxiliar para salvar o array de tarefas no LocalStorage
    function saveTasks(tasks) {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            // showNotification('Dados salvos com sucesso!', 'success'); // Notificação para cada save (pode ser muito)
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
            // Limpa o localStorage se houver erro para evitar loop
            localStorage.removeItem('tasks');
            showNotification('Erro ao carregar dados salvos. Dados antigos foram removidos.', 'error');
            return [];
        }
    }

    // Função para renderizar as subtarefas temporárias (na seção "Adicionar Tarefa")
    function renderCurrentSubtasks() {
        subtaskListContainer.innerHTML = ''; // Limpa a lista existente
        currentSubtasks.forEach((subtask, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${subtask}</span>
                <button type="button" class="remove-subtask-btn" data-index="${index}">
                    <i class="fas fa-times-circle"></i> Remover
                </button>
            `;
            // Adiciona um listener para remover a subtarefa individual
            li.querySelector('.remove-subtask-btn').addEventListener('click', function() {
                const indexToRemove = parseInt(this.dataset.index);
                currentSubtasks.splice(indexToRemove, 1); // Remove a subtarefa do array
                renderCurrentSubtasks(); // Renderiza novamente a lista
                showNotification('Subtarefa removida.', 'success');
            });
            subtaskListContainer.appendChild(li); // Adiciona o item à lista na UI
        });
    }

    // Função para renderizar a lista completa de tarefas
    function renderTaskList(tasksToRender) {
        taskList.innerHTML = ''; // Limpa a lista de tarefas existente na UI
        if (tasksToRender.length === 0) {
            // Exibe uma mensagem se não houver tarefas
            taskList.innerHTML = '<p class="no-tasks-message">Nenhuma tarefa adicionada ainda. Comece a organizar!</p>';
            return;
        }

        tasksToRender.forEach(task => {
            const listItem = document.createElement('li');
            listItem.classList.add('task-item'); // Adiciona a classe para estilização
            listItem.setAttribute('data-id', task.id); // Armazena o ID da tarefa no elemento HTML

            let subtasksHtml = '';
            if (task.subtasks && task.subtasks.length > 0) {
                // Monta o HTML para as subtarefas, se existirem
                subtasksHtml = `
                    <h4><i class="fas fa-tasks"></i> Subtarefas:</h4>
                    <ul class="subtasks-list">
                        ${task.subtasks.map(sub => `<li><i class="fas fa-circle-notch"></i> ${sub}</li>`).join('')}
                    </ul>
                `;
            }

            // Define o conteúdo HTML de cada item da tarefa
            listItem.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description || 'Sem descrição.'}</p>
                <div class="task-status-thermometer">
                    <div class="thermometer-fill" style="width: 0%;"></div>
                </div>
                ${task.imageUrl ? `<div class="task-image-container"><img src="${task.imageUrl}" alt="Imagem da tarefa" class="task-image"></div>` : ''}
                ${subtasksHtml}
                <button type="button" class="delete-btn" data-id="${task.id}"><i class="fas fa-trash-alt"></i> Excluir</button>
            `;
            taskList.appendChild(listItem); // Adiciona o item da tarefa à lista principal
        });

        // Adiciona event listeners para os botões de excluir de cada tarefa
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskIdToDelete = parseInt(this.dataset.id);
                deleteTask(taskIdToDelete); // Chama a função para excluir a tarefa
            });
        });
    }

    // Função para excluir uma tarefa pelo seu ID
    function deleteTask(id) {
        let tasks = getTasks();
        const initialLength = tasks.length;
        tasks = tasks.filter(task => task.id !== id); // Filtra as tarefas, removendo a tarefa com o ID correspondente
        if (tasks.length < initialLength) { // Verifica se alguma tarefa foi realmente removida
            saveTasks(tasks); // Salva a lista atualizada
            renderTaskList(tasks); // Renderiza a lista sem a tarefa excluída
            showNotification('Tarefa excluída com sucesso!', 'success');
        } else {
            showNotification('Erro ao excluir tarefa. Tarefa não encontrada.', 'error');
        }
    }

    // Carrega as tarefas salvas no LocalStorage e renderiza a lista
    function loadTasks() {
        const tasks = getTasks();
        renderTaskList(tasks);
        // showNotification('Tarefas carregadas.', 'success'); // Pode ser muito intrusivo no carregamento inicial
    }

    // --- CHAMADAS INICIAIS E LISTENERS DE EVENTOS ---

    // Carrega as tarefas salvas ao iniciar
    loadTasks();

    // Adiciona um listener para o botão de adicionar subtarefa
    addSubtaskBtn.addEventListener('click', () => {
        const subtaskText = subtaskInput.value.trim();
        if (subtaskText) {
            currentSubtasks.push(subtaskText);
            renderCurrentSubtasks();
            subtaskInput.value = '';
            subtaskInput.focus();
            showNotification('Subtarefa adicionada.', 'success');
        } else {
            alert('Por favor, digite o nome da subtarefa.'); // Mantido alerta para validação simples
            showNotification('Não foi possível adicionar subtarefa: campo vazio.', 'error');
        }
    });

    // Adiciona um listener para o botão de adicionar tarefa principal
    addTaskBtn.addEventListener('click', () => {
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const imageFile = taskImageInput.files && taskImageInput.files.length > 0 ? taskImageInput.files[0] : null;

        if (!title) {
            alert('O título da tarefa é obrigatório.'); // Mantido alerta para validação simples
            showNotification('Erro: O título da tarefa é obrigatório.', 'error');
            taskTitleInput.focus();
            return;
        }

        const addTask = (imageUrl = null) => {
            const task = {
                id: Date.now(),
                title,
                description,
                imageUrl,
                subtasks: [...currentSubtasks],
                createdAt: new Date().toISOString()
            };

            let tasks = getTasks();
            tasks.push(task);
            saveTasks(tasks);
            renderTaskList(tasks);

            // Limpa os campos do formulário e as subtarefas temporárias
            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
            taskImageInput.value = '';
            currentSubtasks = [];
            renderCurrentSubtasks();
            showNotification('Tarefa adicionada com sucesso!', 'success');
        };

        if (imageFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                addTask(reader.result);
            };
            reader.onerror = () => {
                showNotification('Erro ao ler a imagem.', 'error');
                console.error('Erro ao ler a imagem:', reader.error);
                addTask(); // Adiciona a tarefa mesmo sem a imagem se houver erro
            };
            reader.readAsDataURL(imageFile);
        } else {
            addTask();
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
                    if (!Array.isArray(importedTasks) || importedTasks.some(task => !task.title)) {
                        showNotification('Formato de arquivo JSON inválido ou corrompido. Certifique-se de que o arquivo contém um array de tarefas com títulos.', 'error');
                        return;
                    }

                    let existingTasks = getTasks();
                    const newTasks = importedTasks.filter(importedTask =>
                        !existingTasks.some(existingTask => existingTask.id === importedTask.id)
                    );

                    saveTasks([...existingTasks, ...newTasks]);
                    renderTaskList(getTasks());
                    showNotification('Tarefas importadas com sucesso!', 'success');
                    importFile.value = ''; // Limpa o input de arquivo após a importação
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

    // Se não houver tarefas salvas inicialmente (e não for um erro de carregamento), exibe a mensagem de "nenhuma tarefa"
    // Adiciona verificação para não sobrescrever a mensagem de erro de carregamento do localStorage
    if (getTasks().length === 0 && taskList.innerHTML === '') {
        taskList.innerHTML = '<p class="no-tasks-message">Nenhuma tarefa adicionada ainda. Comece a organizar!</p>';
    }
});