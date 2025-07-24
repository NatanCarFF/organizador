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

    let currentSubtasks = []; // Array temporário para armazenar subtarefas enquanto a tarefa principal está sendo criada

    // --- FUNÇÕES AUXILIARES ---

    // Função auxiliar para salvar o array de tarefas no LocalStorage
    function saveTasks(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
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
        }
    }

    // Carrega as tarefas salvas no LocalStorage e renderiza a lista
    function loadTasks() {
        const tasks = getTasks();
        renderTaskList(tasks);
    }

    // --- CHAMADAS INICIAIS E LISTENERS DE EVENTOS ---

    // Carrega as tarefas salvas ao iniciar (agora a função loadTasks está definida)
    loadTasks();

    // Adiciona um listener para o botão de adicionar subtarefa
    addSubtaskBtn.addEventListener('click', () => {
        const subtaskText = subtaskInput.value.trim(); // Pega o texto do input, removendo espaços em branco
        if (subtaskText) { // Verifica se o texto não está vazio
            currentSubtasks.push(subtaskText); // Adiciona a subtarefa ao array temporário
            renderCurrentSubtasks(); // Atualiza a lista de subtarefas temporárias na UI
            subtaskInput.value = ''; // Limpa o campo de input
            subtaskInput.focus(); // Mantém o foco no campo para facilitar a adição de múltiplas subtarefas
        } else {
            alert('Por favor, digite o nome da subtarefa.'); // Alerta se o campo estiver vazio
        }
    });

    // Adiciona um listener para o botão de adicionar tarefa principal
    addTaskBtn.addEventListener('click', () => {
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const imageFile = taskImageInput.files[0]; // Pega o primeiro arquivo de imagem selecionado

        if (!title) { // Validação: título da tarefa é obrigatório
            alert('O título da tarefa é obrigatório.');
            taskTitleInput.focus(); // Coloca o foco de volta no campo do título
            return;
        }

        // Função auxiliar para adicionar a tarefa à lista e salvar
        const addTask = (imageUrl = null) => {
            const task = {
                id: Date.now(), // Gera um ID único baseado no timestamp atual
                title,
                description,
                imageUrl,
                subtasks: [...currentSubtasks], // Cria uma cópia das subtarefas temporárias
                createdAt: new Date().toISOString() // Data de criação da tarefa
            };

            let tasks = getTasks(); // Pega todas as tarefas existentes
            tasks.push(task); // Adiciona a nova tarefa
            saveTasks(tasks); // Salva o array atualizado no LocalStorage
            renderTaskList(tasks); // Renderiza a lista completa de tarefas na UI

            // Limpa os campos do formulário e as subtarefas temporárias
            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
            taskImageInput.value = ''; // Limpa o input de arquivo
            currentSubtasks = []; // Limpa o array de subtarefas
            renderCurrentSubtasks(); // Atualiza a UI para refletir as subtarefas vazias
        };

        // Verifica se uma imagem foi selecionada
        if (imageFile) {
            const reader = new FileReader(); // Cria um FileReader para ler o conteúdo do arquivo
            reader.onloadend = () => {
                addTask(reader.result); // reader.result contém a imagem em formato Base64 (URL de dados)
            };
            reader.readAsDataURL(imageFile); // Inicia a leitura do arquivo como URL de dados
        } else {
            addTask(); // Se não houver imagem, adiciona a tarefa sem ela
        }
    });

    // Adiciona um listener para o botão de exportar tarefas
    exportBtn.addEventListener('click', () => {
        const tasks = getTasks();
        if (tasks.length === 0) {
            alert('Não há tarefas para exportar!');
            return;
        }
        // Converte o array de tarefas para uma string JSON formatada (com indentação de 2 espaços)
        const jsonString = JSON.stringify(tasks, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' }); // Cria um Blob com o conteúdo JSON
        const a = document.createElement('a'); // Cria um elemento <a> para o download
        a.href = URL.createObjectURL(blob); // Define o URL do Blob como href
        a.download = 'minhas_tarefas.json'; // Define o nome do arquivo para download
        document.body.appendChild(a); // Adiciona o elemento <a> ao corpo (temporariamente)
        a.click(); // Simula um clique para iniciar o download
        document.body.removeChild(a); // Remove o elemento <a>
        URL.revokeObjectURL(a.href); // Libera o URL do objeto para evitar vazamentos de memória
    });

    // Adiciona um listener para o botão de importar tarefas
    importBtn.addEventListener('click', () => {
        const file = importFile.files[0]; // Pega o arquivo selecionado
        if (file) {
            // Valida se o arquivo é um JSON
            if (file.type !== 'application/json') {
                alert('Por favor, selecione um arquivo JSON válido.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedTasks = JSON.parse(e.target.result); // Tenta fazer o parse do JSON
                    // Validação básica do formato importado: deve ser um array e cada item deve ter um 'title'
                    if (!Array.isArray(importedTasks) || importedTasks.some(task => !task.title)) {
                        alert('Formato de arquivo JSON inválido ou corrompido. Certifique-se de que o arquivo contém um array de tarefas com títulos.');
                        return;
                    }

                    let existingTasks = getTasks();
                    // Filtra as tarefas importadas para não adicionar duplicatas (baseado no ID)
                    const newTasks = importedTasks.filter(importedTask =>
                        !existingTasks.some(existingTask => existingTask.id === importedTask.id)
                    );

                    // Adiciona as novas tarefas importadas às existentes
                    saveTasks([...existingTasks, ...newTasks]);
                    renderTaskList(getTasks()); // Renderiza a lista atualizada
                    alert('Tarefas importadas com sucesso!');
                    importFile.value = ''; // Limpa o input de arquivo após a importação
                } catch (error) {
                    alert('Erro ao processar o arquivo JSON. Certifique-se de que é um JSON válido.');
                    console.error('Erro de importação:', error);
                }
            };
            reader.readAsText(file); // Lê o conteúdo do arquivo como texto
        } else {
            alert('S