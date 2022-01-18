;(async function () {
  if (typeof window.ethereum !== "undefined" || typeof window.web3 !== "undefined") {
    const provider = window["ethereum"] || window.web3.currentProvider
    console.log({ provider })
  }

  ;[...Array(10).keys()].map(async (num) => {
    const response = await fetch(`https://bafybeidiw2sxsdy3f5rlg77dqi7rg3bheni2xunl2sylifrdxtwfxvjklq.ipfs.dweb.link/${num}.json`)
    const fetchData = await response.json()

    const container = document.getElementById("nft-container")
    container.innerHTML += 
    `
    <div class='p-5 border-[#000] border-2 mt-10 basis-1/6 text-center'> 
      <img src=${fetchData.image} />
      <h1 class='mt-10'>${fetchData.name}</h1>
      <button class='mt-10 border-2 border=[#ccc] rounded-xl cursor-pointer px-20 py-5'>Buy</button>
    </div>
    `
  })
})()
