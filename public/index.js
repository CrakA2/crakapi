document
  .getElementById("userForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const tag = document.getElementById("tag").value;

    const loadingDiv = document.getElementById("loading");
    loadingDiv.style.display = "flex"; 

    const fetchPromise = fetch(`https://tame-yak-gear.cyclic.app//v1/account/${username}/${tag}?fs=json`)
      .then((response) => {
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
          `account/${username}/${tag}`
        );
        createDataElement(
          resultDiv,
          "Region",
          region,
          `account/${username}/${tag}`
        );

        const endpoints = ['hs', 'rr', 'lb', 'kd', 'rankRating', 'leaderboardRank', 'kda', 'headshot'];
        endpoints.forEach((endpoint) => {
          fetch(`https://tame-yak-gear.cyclic.app//v1/${endpoint}/${region}/${puuid}?fs=json`)
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
      })
      .catch((error) => {
        loadingDiv.style.display = "none";
        alert(error.message);
      });
  });

function createDataElement(parent, labelContent, dataContent, endpoint) {
  const dataDiv = document.createElement("div");
  dataDiv.classList.add("data-div");

  const dataLabel = document.createElement("label");
  dataLabel.textContent = `${labelContent}:`;
  dataLabel.classList.add("data-label");
  dataDiv.appendChild(dataLabel);

  const dataText = document.createElement("span");
  dataText.textContent = dataContent;
  dataText.classList.add("data-text");
  dataDiv.appendChild(dataText);

  const copyLink = document.createElement("a");
  copyLink.textContent = "Copy API Endpoint";
  copyLink.href = "#";
  copyLink.classList.add("copy-link");
  copyLink.addEventListener("click", function (event) {
    event.preventDefault();
    navigator.clipboard.writeText(`https://tame-yak-gear.cyclic.app//v1/${endpoint}`);
  });
  dataDiv.appendChild(copyLink);

  parent.appendChild(dataDiv);
}