;(async function () {
  const fetchData = await fetch("./assets/data/collectibles.json")
  const collectibles = await fetchData.json()

  const contractJSON = JSON.parse(document.getElementById("contract").innerText)

  const container = document.getElementById("nft-container")
  collectibles.map(async (collectible, index) => {
    container.innerHTML += `
    <div class='flex flex-col w-full overflow-hidden bg-[#fcfcfc] backdrop-blur-sm bg-white/30  m-10 text-center rounded-xl shadow-lg hover:shadow-2xl sm:w-64' id="item-${
      index + 1
    }"> 
      <img class="w-full rounded-t-xl" src=${collectible.url} alt=${collectible.name} />
      <h1 class='mt-4 text-xl font-semibold'>${collectible.name}</h1>
      <ul class="flex flex-row justify-evenly mt-4 leading-relaxed">
        <li class="price text-gray-600">${collectible.price} Matic</li>
        <li class="qty text-gray-600">${collectible.left} Left</li>
      </ul>
      <span class="bg-white text-white font-bold py-2 mt-2" id="success-${index + 1}">&nbsp;</span>
      <button class='bg-blue-400 text-white rounded-b-xl cursor-pointer px-20 py-5 font-semibold buy-button hover:bg-blue-500'>Buy</button>
    </div>
    `
  })

  const header = document.getElementById("header")
  header.innerHTML += `
  <button class='mb-4 bg-blue-400 mt-6 text-white rounded-xl cursor-pointer px-20 py-5 font-semibold' id="connect">Connect To Metamask</button>
  <br /><span class="text-red-700" id="error">&nbsp;</span>
  `

  const connect = document.getElementById("connect")
  connect.disable = function (disabled) {
    connect.setAttribute("disabled", disabled)
    connect.disabled = disabled
    return disabled
  }

  connect.addEventListener("click", async (e) => {
    connect.disable(true)
    const { web3, connected, message, account, contract } = await install()
    if (!connected) {
      if(message === "Please change network to Polygon (MATIC)."){
        error.innerHTML = `Please change network to <a class="underline text-blue-400 font-bold" href="https://academy.binance.com/en/articles/how-to-add-polygon-to-metamask">Polygon (MATIC).</a>` 
      }else{
        error.innerHTML = message
      }
      return connect.disable(false)
    }

    for (let i = 0; i < 15; i++) {
      initBuyBox(i + 1, web3, account, contract)
    }
  })

  const install = async () => {
    if (!window.ethereum?.isMetaMask) {
      return {
        connected: false,
        message: 'Please install <a class="underline cursor-pointer text-blue-400 font-bold" href="https://metamask.io/" target="_blank">MetaMask</a>',
      }
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      const networkId = await window.ethereum.request({ method: "net_version" })
      if (networkId == contractJSON.chain_id) {
        const web3 = new Web3(window.ethereum)
        header.innerHTML = `<button class='mb-4 bg-blue-400 mt-6 text-white rounded-sm px-20 py-5 font-semibold'>Connected to: ${accounts[0]}</button>`
        return {
          connected: true,
          account: accounts[0],
          web3: web3,
          contract: new web3.eth.Contract(contractJSON.abi, contractJSON.address),
        }
      }

      return {
        connected: false,
        message: `Please change network to ${contractJSON.chain_name}.`,
      }
    } catch (e) {
      return { connected: false, message: e.message }
    }
  }

  const initBuyBox = async (index, web3, account, contract) => {
    const ether = 1000000000000000000
    const box = document.getElementById(`item-${index}`)
    const button = box.getElementsByTagName("button")[0]
    const quantity = box.getElementsByClassName("qty")[0]
    const price = box.getElementsByClassName("price")[0]

    button.disable = function (disabled) {
      button.setAttribute("disabled", disabled)
      button.disabled = disabled
      return disabled
    }

    //get cost
    const cost = await read(contract, account, "collectionOffer", index)
    price.innerHTML = `${cost / ether} MATIC`
    //get size and supply
    const size = await read(contract, account, "collectionSize", index)
    const supply = await read(contract, account, "collectionSupply", index)
    const qty = size - supply
    quantity.innerHTML = `${qty} Left`

    if (qty < 1) {
      button.innerHTML = "Sold Out"
      button.classList.remove("bg-blue-400")
      button.classList.add("bg-gray-400")
      button.disable(true)
    }

    button.removeEventListener("click", perBuyFunction)

    button.addEventListener("click", async (e) => {
      e.preventDefault()
      button.disable(true)
      let txHash = ""
      try {
        txHash = await write(contract, account, "buy", `${web3.utils.toHex(cost)}`, index)
        setSuccess(button, index, txHash)
      } catch (e) {
        error.innerHTML = e.message
        return button.disable(false)
      }
    })
  }

  const setSuccess = async (button, index, txHash) => {
    const success = document.getElementById(`success-${index}`)
    success.classList.add("bg-green-600")
    success.innerHTML = `<a class="font-semibold underline" href="https://polygonscan.com/tx/${txHash}" target="_blank">View Transaction</a>`

    setTimeout(async () => {
      return button.disable(false)
    }, 3000)
  }

  const read = async (contract, account, method, ...args) => {
    return await contract.methods[method](...args).call()
  }

  const write = async (contract, account, method, value, ...args) => {
    const params = {
      to: contractJSON.address,
      from: account,
      value: String(value),
      data: contract.methods[method](...args).encodeABI(),
    }

    if (value) params.value = String(value)

    return await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [params],
    })
  }

  const buyButtons = Array.from(document.getElementsByClassName("buy-button"))
  const perBuyFunction = async (btn) => {
    const { web3, connected, message, account, contract } = await install()
    if (!connected) {
      error.innerHTML = message
      return connect.disable(false)
    }

    for (let i = 0; i < 15; i++) {
      initBuyBox(i + 1, web3, account, contract)
    }
  }
  buyButtons.forEach(async (buyBtn, index) => {
    buyBtn.addEventListener("click", perBuyFunction)
  })
})()
