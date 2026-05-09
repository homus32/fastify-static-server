
// XSS-safe helper
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Рендер страниц
async function renderUsersList() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '<p class="loading">Загрузка...</p>';

  try {
    const users = await api.getUsers();
    let html = '<h1>Список пользователей</h1>';
    html += '<a href="/create" class="nav-link" id="link-create">Создать пользователя</a>';

    if (users.length === 0) {
      html += '<p>Пользователей нет.</p>';
      app.innerHTML = html;
      document.getElementById('link-create').onclick = (e) => {
        e.preventDefault();
        navigate('/create');
      };
      return;
    }

    html += `<table><thead><tr><th>ID</th><th>Имя</th><th>Email</th><th>Действия</th></tr></thead><tbody>`;
    users.forEach((user) => {
      html += `<tr>
        <td>${escapeHtml(user.id)}</td>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td><div class="actions">
          <a href="/edit/${user.id}" class="btn-edit" data-edit="${user.id}">Изменить</a>
          <button class="btn-danger" data-delete="${user.id}" data-name="${escapeHtml(user.name)}">Удалить</button>
        </div></td>
      </tr>`;
    });
    html += '</tbody></table>';
    html += `<div class="api-test-block"><button id="api-test-btn">Проверить API</button><p id="api-result"></p></div>`;

    app.innerHTML = html;

    document.getElementById('link-create').onclick = (e) => {
      e.preventDefault();
      navigate('/create');
    };
    document.querySelectorAll('[data-edit]').forEach((el) => {
      el.onclick = (e) => {
        e.preventDefault();
        navigate(`/edit/${el.dataset.edit}`);
      };
    });
    document.querySelectorAll('[data-delete]').forEach((el) => {
      el.onclick = async () => {
        if (!confirm(`Удалить пользователя ${el.dataset.name}?`)) return;
        el.disabled = true;
        el.textContent = 'Удаление...';
        try {
          await api.deleteUser(el.dataset.delete);
          await renderUsersList();
        } catch (err) {
          el.disabled = false;
          el.textContent = 'Удалить';
          alert(`Ошибка: ${err.message}`);
        }
      };
    });
    document.getElementById('api-test-btn').onclick = async () => {
      const result = document.getElementById('api-result');
      result.textContent = 'Загрузка...';
      result.className = 'loading';
      try {
        const data = await api.getUserCount();
        result.textContent = `Всего пользователей: ${data.count}`;
        result.className = 'success-message';
      } catch {
        result.textContent = 'Ошибка соединения с сервером';
        result.className = 'error-message';
      }
    };
  } catch (err) {
    app.innerHTML = `<p class="error-message">Ошибка загрузки: ${escapeHtml(err.message)}</p>`;
  }
}

function renderFormHtml(title, submitText, nameValue, emailValue) {
  const nameVal = nameValue !== undefined ? `value="${escapeHtml(nameValue)}"` : '';
  const emailVal = emailValue !== undefined ? `value="${escapeHtml(emailValue)}"` : '';
  return `
    <h1>${title}</h1>
    <a href="/" class="nav-link" id="link-back">← К списку</a>
    <form id="user-form">
      <div><label for="name">Имя:</label><input type="text" id="name" name="name" required ${nameVal}></div>
      <div><label for="email">Email:</label><input type="email" id="email" name="email" required ${emailVal}></div>
      <button type="submit" id="form-submit">${submitText}</button>
    </form>
    <p id="form-error" class="error-message" style="display:none"></p>
  `;
}

function attachFormHandler(id, submitFn, onSuccess, getValues) {
  let submitting = false;

  document.getElementById('link-back').onclick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  document.getElementById('user-form').onsubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    submitting = true;

    const btn = document.getElementById('form-submit');
    const errEl = document.getElementById('form-error');
    btn.disabled = true;
    btn.textContent = 'Сохранение...';
    errEl.style.display = 'none';

    try {
      const vals = getValues();
      await submitFn(vals);
      onSuccess();
    } catch (err) {
      errEl.textContent = `Ошибка: ${err.message}`;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = btn.dataset.original || 'Сохранить';
      submitting = false;
    }
  };
}

async function renderCreateUser() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = renderFormHtml('Создать пользователя', 'Создать');

  document.getElementById('form-submit').dataset.original = 'Создать';

  attachFormHandler(
      null,
      (vals) => api.createUser(vals),
      () => navigate('/'),
      () => (
          {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value
          })
  );
}

async function renderEditUser(id) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '<p class="loading">Загрузка...</p>';

  let user;
  try {
    user = await api.getUser(id);
  } catch (err) {
    app.innerHTML = `
      <h1>Пользователь не найден</h1>
      <a href="/" class="nav-link" id="link-back">← К списку</a>
    `;
    document.getElementById('link-back').onclick = (e) => {
      e.preventDefault();
      navigate('/');
    };
    return;
  }

  app.innerHTML = renderFormHtml('Редактировать пользователя', 'Сохранить', user.name, user.email);

  document.getElementById('form-submit').dataset.original = 'Сохранить';

  attachFormHandler(
      id,
      (vals) => api.updateUser(id, vals),
      () => navigate('/'),
      () => (
          {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value
          }
      )
  );
}

// Роутер тут
function matchRoute(path) {
  const match = path.match(/^\/edit\/(\d+)$/);
  if (match) return {route: '/edit/:id', params: {id: match[1]}};
  return null;
}

function navigate(path) {
  history.pushState(null, '', path);
  renderRoute(path);
}

async function renderRoute(path) {
  const app = document.getElementById('app');
  if (!app) return;

  try {
    if (path === '/') {
      await renderUsersList();
    } else if (path === '/create') {
      await renderCreateUser();
    } else {
      const matched = matchRoute(path);
      if (matched) {
        await renderEditUser(matched.params.id);
      } else {
        await renderUsersList();
      }
    }
  } catch (err) {
    app.innerHTML = `<p class="error-message">Неизвестная ошибка: ${escapeHtml(err.message)}</p>`;
  }
}

async function getErrorMessage(res) {
  try {
    const body = await res.json();
    return body.error || 'Unknown error';
  } catch {
    return 'Network error';
  }
}

const api = {
  async getUsers() {
    const r = await fetch('/api/users');
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  },
  async getUser(id) {
    const r = await fetch(`/api/users/${id}`);
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  },
  async createUser(data) {
    const r = await fetch('/api/users', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  },
  async updateUser(id, data) {
    const r = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  },
  async deleteUser(id) {
    const r = await fetch(`/api/users/${id}`, {method: 'DELETE'});
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  },
  async getUserCount() {
    const r = await fetch('/api/users/count');
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  },
};

window.addEventListener('popstate', () => renderRoute(window.location.pathname));
renderRoute(window.location.pathname);
