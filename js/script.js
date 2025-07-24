document.addEventListener('DOMContentLoaded', () => {
     const taskTitleInput = document.getElementById('taskTitle');
     const taskDescriptionInput = document.getElementById('taskDescription');
     const taskImageInput = document.getElementById('taskImage');
     const addTaskBtn = document.getElementById('addTaskBtn');
     const taskList = document.getElementById('taskList');
     const exportBtn = document.getElementById('exportBtn');
     const importFile = document.getElementById('importFile');
     const importBtn = document.getElementById('importBtn');
     const addSubtaskBtn = document.getElementById('addSubtaskBtn');
     const subtaskListContainer = document.getElementById('subtaskList');
     let subtasks = [];

     loadTasks();

     addSubtaskBtn.addEventListener('click', () => {
         const subtaskText = prompt('Digite o nome da subtarefa:');
         if (subtaskText) {
             subtasks.push(subtaskText);
             renderSubtasks();
         }
     });

     function renderSubtasks() {
         subtaskListContainer.innerHTML = '';
         subtasks.forEach((subtask, index) => {
             const li = document.createElement('li');
             li.innerHTML = `<span>${subtask}</span><button type="button" data-index="${index}">Remover</button>`;
             li.querySelector('button').addEventListener('click', function() {
                 subtasks.splice(this.dataset.index, 1);
                 renderSubtasks();
             });
             subtaskListContainer.appendChild(li);
         });
     }

     addTaskBtn.addEventListener('click', () => {
         const title = taskTitleInput.value.trim();
         const description = taskDescriptionInput.value.trim();
         const imageFile = taskImageInput.files && taskImageInput.files.length > 0 ? taskImageInput.files.item(0) : null;

         if (title) {
             const reader = new FileReader();
             let imageUrl = null;

             reader.onloadend = () => {
                 imageUrl = reader.result;
                 addTaskToList(title, description, imageUrl, [...subtasks]);
                 taskTitleInput.value = '';
                 taskDescriptionInput.value = '';
                 taskImageInput.value = '';
                 subtasks = [];
                 renderSubtasks();
             };

             if (imageFile) {
                 reader.readAsDataURL(imageFile);
             } else {
                 addTaskToList(title, description, null, [...subtasks]);
                 taskTitleInput.value = '';
                 taskDescriptionInput.value = '';
                 subtasks = [];
                 renderSubtasks();
             }
         } else {
             alert('O título da tarefa é obrigatório.');
         }
     });

     function addTaskToList(title, description, imageUrl, subtasks) {
         const task = { title, description, imageUrl, subtasks };
         let tasks = getTasks();
         tasks.push(task);
         saveTasks(tasks);
         renderTaskList(tasks);
     }

     function renderTaskList(tasks) {
         taskList.innerHTML = '';
         tasks.forEach((task, index) => {
             const listItem = document.createElement('li');
             listItem.classList.add('task-item');
             listItem.innerHTML = `
                 <h3>${task.title}</h3>
                 <p>${task.description}</p>
                 ${task.imageUrl ? `<div class="task-image-container"><img src="${task.imageUrl}" alt="Imagem da tarefa" class="task-image"></div>` : ''}
                 ${task.subtasks.length > 0 ? `<h4>Subtarefas:</h4><ul class="subtasks-list">${task.subtasks.map(subtask => `<li>- ${subtask}</li>`).join('')}</ul>` : ''}
                 <button type="button" class="delete-btn" data-index="${index}">Excluir</button>
             `;
             taskList.appendChild(listItem);
         });

         document.querySelectorAll('.delete-btn').forEach(btn => {
             btn.addEventListener('click', function() {
                 deleteTask(this.dataset.index);
             });
         });
     }

     function deleteTask(index) {
         let tasks = getTasks();
         tasks.splice(index, 1);
         saveTasks(tasks);
         renderTaskList(tasks);
     }

     exportBtn.addEventListener('click', () => {
         const tasks = getTasks();
         const jsonString = JSON.stringify(tasks, null, 2);
         const blob = new Blob([jsonString], { type: 'application/json' });
         const a = document.createElement('a');
         a.href = URL.createObjectURL(blob);
         a.download = 'tasks.json';
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
     });

     importBtn.addEventListener('click', () => {
         const file = importFile.files && importFile.files.length > 0 ? importFile.files.item(0) : null;
         if (file) {
             const reader = new FileReader();
             reader.onload = (e) => {
                 try {
                     const importedTasks = JSON.parse(e.target.result);
                     saveTasks(importedTasks);
                     renderTaskList(importedTasks);
                 } catch (error) {
                     alert('Erro ao importar o arquivo JSON.');
                 }
             };
             reader.readAsText(file);
         } else {
             alert('Selecione um arquivo JSON para importar.');
         }
     });

     function saveTasks(tasks) {
         localStorage.setItem('tasks', JSON.stringify(tasks));
     }

     function getTasks() {
         const tasksString = localStorage.getItem('tasks');
         return tasksString ? JSON.parse(tasksString) : [];
     }

     function loadTasks() {
         const tasks = getTasks();
         renderTaskList(tasks);
     }
 });