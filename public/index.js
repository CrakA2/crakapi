document
  .getElementById("userForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const tag = document.getElementById("tag").value;

    const loadingDiv = document.getElementById("loading");
    loadingDiv.style.display = "flex";

    const fetchPromise = fetch(
      `https://api.crak.tech/v1/account/${username}/${tag}?fs=json`
    ).then((response) => {
      if (!response.ok) {
        throw new Error("Name or Tag not valid");
      }
      return response.json();
    });

    const delayPromise = new Promise((resolve) => setTimeout(resolve, 5000));

    Promise.all([fetchPromise, delayPromise])
      .then(([data]) => {
        loadingDiv.style.display = "none";

        const puuid = data.account.puuid;
        const region = data.account.region;

        const resultDiv = document.getElementById("results");
        resultDiv.classList.add("text-center", "result-div");

        createDataElement(
          resultDiv,
          "PUUID",
          puuid,
          `${puuid}`
        );
        const regionMapping = {
          'ap': 'Asia-Pacific[AP]',
        };
        
        const fullName = regionMapping[region] || region;
        
        createDataElement(
          resultDiv,
          "Region",
          fullName,
          `${fullName}`
        );

        const endpoints = [
          "hs",
          "rr",
          "lb",
          "kd",
        ];
        createDataElement(
          resultDiv,
          "Win Loss Tracker (Put in OBS browser source)",
          region,
          `wl/${region}/${puuid}/sessiondata`
        );
        createDataElement(
          resultDiv,
          "Win Loss API Endpoint",
          region,
          `wl/${region}/${puuid}`
        );
        endpoints.forEach((endpoint) => {
          fetch(
            `https://api.crak.tech/v1/${endpoint}/${region}/${puuid}?fs=json`
          )
            .then((response) => response.json())
            .then((data) => {
              Object.keys(data).forEach((key) => {
                createDataElement(
                  resultDiv,
                  `${endpoint.toUpperCase()} - ${key}`,
                  data[key],
                  `${endpoint}/${region}/${puuid}`
                );
              });
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        });
        document.getElementById("userForm").style.display = "none";
        document.getElementById("Main").style.display = "none";
        document.body.style.overflowX = "hidden";
        document.body.style.overflowY = "scroll";
      })
      .catch((error) => {
        loadingDiv.style.display = "none";
        alert(error.message);
      });
  });

function createDataElement(parent, labelContent, dataContent, endpoint) {
  const dataDiv = document.createElement("div");
  dataDiv.classList.add("data-div", "d-flex", "flex-column", "mb-3");

  const dataLabel = document.createElement("label");
  dataLabel.textContent = labelContent + `: ${dataContent}`;
  dataLabel.classList.add("data-label", "mb-1");
  dataDiv.appendChild(dataLabel);


  const dataInputGroup = document.createElement("div");
  dataInputGroup.classList.add("input-group", "row");

  const dataInput = document.createElement("input");
  dataInput.value = `https://api.crak.tech/v1/${endpoint}`;
  dataInput.readOnly = true;
  dataInput.classList.add("form-control", "data-input", "col-11");

  dataInputGroup.appendChild(dataInput);

  const copyButton = document.createElement("button");
  copyButton.classList.add("small-button", "col-1");
  copyButton.addEventListener("click", function (event) {
    event.preventDefault();
    navigator.clipboard.writeText(dataInput.value);
  });


  const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  copyIcon.setAttribute("viewBox", "0 0 101 130");
  copyIcon.setAttribute("width", "15px");
  copyIcon.setAttribute("height", "15px");

  copyButton.appendChild(copyIcon);
  dataDiv.appendChild(dataInputGroup);

  const copyPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  copyPath.setAttribute("class", "st0");
  copyPath.setAttribute("fill", "#fff");
  copyPath.setAttribute(
    "d",
    "M97.67,20.81L97.67,20.81l0.01,0.02c3.7,0.01,7.04,1.51,9.46,3.93c2.4,2.41,3.9,5.74,3.9,9.42h0.02v0.02v75.28 v0.01h-0.02c-0.01,3.68-1.51,7.03-3.93,9.46c-2.41,2.4-5.74,3.9-9.42,3.9v0.02h-0.02H38.48h-0.01v-0.02 c-3.69-0.01-7.04-1.5-9.46-3.93c-2.4-2.41-3.9-5.74-3.91-9.42H25.1c0-25.96,0-49.34,0-75.3v-0.01h0.02 c0.01-3.69,1.52-7.04,3.94-9.46c2.41-2.4,5.73-3.9,9.42-3.91v-0.02h0.02C58.22,20.81,77.95,20.81,97.67,20.81L97.67,20.81z M0.02,75.38L0,13.39v-0.01h0.02c0.01-3.69,1.52-7.04,3.93-9.46c2.41-2.4,5.74-3.9,9.42-3.91V0h0.02h59.19 c7.69,0,8.9,9.96,0.01,10.16H13.4h-0.02v-0.02c-0.88,0-1.68,0.37-2.27,0.97c-0.59,0.58-0.96,1.4-0.96,2.27h0.02v0.01v3.17 c0,19.61,0,39.21,0,58.81C10.17,83.63,0.02,84.09,0.02,75.38L0.02,75.38z M100.91,109.49V34.2v-0.02h0.02 c0-0.87-0.37-1.68-0.97-2.27c-0.59-0.58-1.4-0.96-2.28-0.96v0.02h-0.01H38.48h-0.02v-0.02c-0.88,0-1.68,0.38-2.27,0.97 c-0.59,0.58-0.96,1.4-0.96,2.27h0.02v0.01v75.28v0.02h-0.02c0,0.88,0.38,1.68,0.97,2.27c0.59,0.59,1.4,0.96,2.27,0.96v-0.02h0.01 h59.19h0.02v0.02c0.87,0,1.68-0.38,2.27-0.97c0.59-0.58,0.96-1.4,0.96-2.27L100.91,109.49L100.91,109.49L100.91,109.49 L100.91,109.49z"
  );

  copyIcon.appendChild(copyPath);
  dataInputGroup.appendChild(copyButton);

  parent.appendChild(dataDiv);
}

document.getElementById('username').addEventListener('change', function() {
  this.value = encodeURIComponent(this.value);
});

document.getElementById('tag').addEventListener('change', function() {
  this.value = encodeURIComponent(this.value);
});
for (let i = 0; i < 24; i++) {
  const option = document.createElement('option');
  option.value = i;
  option.text = `${i}:00`;
  document.getElementById('resetTime').appendChild(option);
}

fetch(`/v1/wl/${region}/${puuid}/reset_time`)
  .then(response => response.json())
  .then(data => {
    const resetTime = new Date(data.reset_time).getUTCHours();
    document.getElementById('resetTime').value = resetTime;
  })
  .catch(error => console.error('Error:', error));
const resetTimeForm = document.getElementById('resetTimeForm');
resetTimeForm.style.display = 'flex';
document.getElementById('resetTimeForm').addEventListener('submit', event => {
  event.preventDefault();

  const resetTime = document.getElementById('resetTime').value;
  const resetTimeInMilliseconds = new Date().setUTCHours(resetTime, 0, 0, 0);

  updateResetTime(region, puuid, resetTimeInMilliseconds);
});