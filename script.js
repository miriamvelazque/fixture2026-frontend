// Usamos el backend en localhost para traer todos los partidos
fetch("http://localhost:3000/matches")
  .then(res => res.json())
  .then(data => {
    const matches = data.matches;

    // Agrupar partidos por grupo
    const grupos = {};
    matches.forEach(p => {
      if (!grupos[p.group]) grupos[p.group] = [];
      grupos[p.group].push(p);
    });

    // Crear pestañas de navegación
    const tabsContainer = document.getElementById("group-tabs");
    const matchesContainer = document.getElementById("matches-container");
    tabsContainer.innerHTML = "";
    matchesContainer.innerHTML = "";

    Object.keys(grupos).forEach(grupo => {
      const tab = document.createElement("button");
      tab.textContent = grupo.replace("GROUP_", "Grupo ");
      tab.className = "tab-btn";
      tab.onclick = () => renderGroup(grupo, grupos[grupo]);
      tabsContainer.appendChild(tab);
    });

    // Renderizar el primer grupo por defecto
    const primerGrupo = Object.keys(grupos)[0];
    renderGroup(primerGrupo, grupos[primerGrupo]);

    // Actualizar tabla de posiciones
    updateStandings(grupos);
  })
  .catch(err => {
    console.error("Error al traer partidos:", err);
    document.getElementById("matches-container").innerHTML = `
      <p style="color: #ff4444; font-weight: bold;">
        ⚠️ No se pudieron cargar los partidos. Intenta más tarde.
      </p>
    `;
  });

function renderGroup(grupo, partidos) {
  const matchesContainer = document.getElementById("matches-container");
  matchesContainer.innerHTML = "";

  const titulo = document.createElement("h3");
  titulo.textContent = grupo.replace("GROUP_", "Grupo ");
  matchesContainer.appendChild(titulo);

  partidos.forEach(p => {
    const item = document.createElement("div");
    item.className = "partido";

    if (p.status === "FINISHED") {
      item.textContent = `${p.homeTeam.name} ${p.score.fullTime.home} - ${p.score.fullTime.away} ${p.awayTeam.name}`;
    } else {
      item.textContent = `${p.homeTeam.name} vs ${p.awayTeam.name} - ${new Date(p.utcDate).toLocaleString()}`;
    }

    matchesContainer.appendChild(item);
  });
}

function updateStandings(grupos) {
  const tbody = document.querySelector(".standings-section tbody");
  tbody.innerHTML = "";

  Object.entries(grupos).forEach(([grupo, partidos]) => {
    const teams = {};

    partidos.forEach(p => {
      if (p.status === "FINISHED") {
        const home = p.homeTeam.name;
        const away = p.awayTeam.name;
        const homeGoals = p.score.fullTime.home;
        const awayGoals = p.score.fullTime.away;

        if (!teams[home]) teams[home] = { pts:0, pj:0, g:0, e:0, p:0, gf:0, gc:0 };
        if (!teams[away]) teams[away] = { pts:0, pj:0, g:0, e:0, p:0, gf:0, gc:0 };

        teams[home].pj++; teams[away].pj++;
        teams[home].gf += homeGoals; teams[home].gc += awayGoals;
        teams[away].gf += awayGoals; teams[away].gc += homeGoals;

        if (homeGoals > awayGoals) {
          teams[home].g++; teams[home].pts += 3;
          teams[away].p++;
        } else if (homeGoals < awayGoals) {
          teams[away].g++; teams[away].pts += 3;
          teams[home].p++;
        } else {
          teams[home].e++; teams[away].e++;
          teams[home].pts++; teams[away].pts++;
        }
      }
    });

    // Encabezado de grupo en la tabla
    const trHeader = document.createElement("tr");
    trHeader.innerHTML = `<td colspan="9" style="font-weight:bold; background:#222; color:#fff;">${grupo.replace("GROUP_", "Grupo ")}</td>`;
    tbody.appendChild(trHeader);

    Object.entries(teams).forEach(([name, stats]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${name}</td>
        <td>${stats.pts}</td>
        <td>${stats.pj}</td>
        <td>${stats.g}</td>
        <td>${stats.e}</td>
        <td>${stats.p}</td>
        <td>${stats.gf}</td>
        <td>${stats.gc}</td>
        <td>${stats.gf - stats.gc}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}
