import React, { useEffect, useRef, useState } from "react";
import NFTAddress from "../contractsData/NFT-address.json";
import NFTAbi from "../contractsData/NFT.json";
import MarketplaceAddress from "../contractsData/MarketPlace-address.json";
import MarketplaceAbi from "../contractsData/Marketplace.json";
import { useSDK } from "@metamask/sdk-react";
import { create } from "ipfs-http-client";
import { Buffer } from "buffer";

const Home = () => {
  const imageRef = useRef();
  const { ethers } = require("ethers");
  const { account, sdk, connected } = useSDK();
  const [disableSubmit, setDisableSubmit] = useState(false);
  const [listedItems, setListedItems] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [uploadedItems, setAllUploadedItems] = useState([]);
  const [purchasesArr, setPurchasesArr] = useState([]);
  const [inputImage, setInputImage] = useState("");
  const [nftContract, setNftContract] = useState("");
  const [marketPlaceContract, setMarketPlaceContract] = useState("");
  const [inputValues, setInputValues] = useState({
    name: "",
    amount: "",
    description: "",
  });
  const [editNft, setEditNft] = useState({
    status: false,
    id: "",
  });

  useEffect(() => {
    const getProviderSigner = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const Nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);
      const marketplace = new ethers.Contract(
        MarketplaceAddress.address,
        MarketplaceAbi.abi,
        signer
      );
      setMarketPlaceContract(marketplace);
      setNftContract(Nft);
    };
    if (account) {
      getProviderSigner();
    }
  }, [account]);

  const auth =
    "Basic " +
    Buffer.from(
      "2Gg95YqQ672apEtGQbewfwGQANc" + ":" + "b2c85789868e83772bfbc59ddd6d09bb"
    ).toString("base64");

  const client = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: auth,
    },
  });

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const resp = await client.add(file);
        setInputImage(`https://ipfs.io/ipfs/${resp.path}`);
      } catch (error) {
        console.log("error", error);
      }
    }
  };

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
    } catch (err) {
      console.warn(`failed to connect..`, err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDisableSubmit(true);
    try {
      if (editNft.status) {
        const listingPrice = ethers.utils.parseEther(
          inputValues.amount.toString()
        );
        const finalResponse = await (
          await marketPlaceContract.updateNftPrice(editNft.id, listingPrice)
        ).wait();
        console.log("finalResponse", finalResponse);
        if (finalResponse?.status) {
          setDisableSubmit(false);
          setEditNft({
            status: false,
            id: "",
          });
          imageRef.current.value = "";
          getAllNfts();
          getAllUploadedNfts();
          setInputValues({
            name: "",
            amount: "",
            description: "",
          });
          setInputImage("");
        }
      } else {
        const result = await client.add(
          JSON.stringify({ inputImage, ...inputValues }) //making token uri with all data
        );
        const uri = `https://ipfs.io/ipfs/${result.path}`;
        const resp = await nftContract.mintNft(uri); //minting nft with uri; after minting value of token uri becomes 1
        const waitResp = await resp.wait();
        const id = await nftContract?.tokenCount(); //getting that token count which is in binary
        const appResp = await (
          await nftContract.setApprovalForAll(marketPlaceContract.address, true)
        ) //approving market place to send the nft
          .wait();
        const listingPrice = ethers.utils.parseEther(
          //converting number into ethers
          inputValues.amount.toString()
        );
        const finalResponse = await (
          await marketPlaceContract.makeItem(
            //market place making nft's available to sell,buy nft's by other
            nftContract.address,
            id,
            listingPrice
          )
        ).wait();
        if (finalResponse?.status) {
          setDisableSubmit(false);
          imageRef.current.value = "";
          getAllNfts();
          getAllUploadedNfts();
          setInputValues({
            name: "",
            amount: "",
            description: "",
          });
          setInputImage("");
        }
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const getAllNfts = async () => {
    const itemCount = await marketPlaceContract?.itemCount();
    let listedItems = [];
    let soldItems = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketPlaceContract.items(i);
      if (item.seller.toLowerCase() === account.toLowerCase()) {
        const uri = await nftContract.tokenURI(item.tokenId);
        const response = await fetch(uri);
        const metadata = await response.json();
        const totalPrice = await marketPlaceContract?.getTotalPrice(
          item.itemId
        );
        let nftItem = {
          totalPrice,
          itemId: item.itemId,
          name: metadata.name,
          description: metadata.description,
          amount: metadata.amount,
          seller: item.seller,
          image: metadata.inputImage,
        };
        listedItems.push(nftItem);
        if (item.sold) soldItems.push(nftItem);
      }
    }
    setAllUploadedItems(listedItems);
    setSoldItems(soldItems);
  };

  const getAllUploadedNfts = async () => {
    const itemCount = await marketPlaceContract.itemCount();
    let items = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketPlaceContract.items(i);
      if (!item.sold) {
        //filtering only on the basis of sold nft key i.e T or F
        const uri = await nftContract.tokenURI(item.tokenId);
        const response = await fetch(uri);

        const metadata = await response.json();
        const totalPrice = await marketPlaceContract.getTotalPrice(item.itemId);
        items.push({
          totalPrice,
          itemId: item.itemId,
          seller: item.seller,
          sold: item.sold,
          nft: item.nft,
          name: metadata.name,
          description: metadata.description,
          image: metadata.inputImage,
          price: metadata.amount,
          tokenId: item.tokenId,
        });
      }
    }
    setListedItems(items);
  };

  useEffect(() => {
    if (marketPlaceContract?.address && account) {
      getAllNfts();
      getAllUploadedNfts();
    }
  }, [marketPlaceContract, account]);

  console.log(marketPlaceContract);
  const handlePurchaseNft = async (item) => {
    const resp = await marketPlaceContract.purchaseItem(item.itemId, {
      value: item.totalPrice, //why we are passing this value in puchasing nft?
    });
    console.log(resp);
    const finalResp = await resp.wait();
    if (finalResp.status) {
      getAllNfts();
      getAllPurchasedItems();
    }
  };

  const getAllPurchasedItems = async () => {
    const filter = marketPlaceContract.filters.Bought(
      //filters gives events that saved on blockchain
      null,
      null,
      null,
      null,
      null,
      account
    );
    const results = await marketPlaceContract.queryFilter(filter);
    const purchases = await Promise.all(
      results.map(async (i) => {
        const uri = await nftContract.tokenURI(i.args.tokenId);
        const response = await fetch(uri);
        const metadata = await response.json();
        const totalPrice = await marketPlaceContract.getTotalPrice(
          i.args.itemId
        );
        let purchasedItem = {
          totalPrice,
          itemId: i.args.itemId,
          seller: i.args.seller,
          name: metadata.name,
          description: metadata.description,
          price: metadata.amount,
          image: metadata.inputImage,
        };
        return purchasedItem;
      })
    );
    setPurchasesArr(purchases);
  };

  useEffect(() => {
    if (marketPlaceContract?.address && account) {
      getAllPurchasedItems();
    }
  }, [marketPlaceContract, account]);

  const handleChangePrice = async (item) => {
    console.log(item);
    setInputValues({
      name: item.name,
      amount: item.price,
      description: item.description,
    });
    setEditNft({
      status: true,
      id: item.itemId,
    });
  };

  return (
    <>
      <div>
        <button style={{ padding: 10, margin: 10 }} onClick={connect}>
          Connect
        </button>
        {connected && <div>{account && `Connected account: ${account}`}</div>}
        {connected && (
          <form
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "20px",
            }}
            onSubmit={handleSubmit}
          >
            <input
              ref={imageRef}
              type="file"
              disabled={editNft.status}
              placeholder="Please upload image"
              onChange={handleImageChange}
            />
            <input
              type="text"
              disabled={editNft.status}
              name="name"
              value={inputValues.name}
              onChange={handleChange}
              placeholder="Please enter nft name"
            />
            <input
              type="number"
              name="amount"
              value={inputValues.amount}
              onChange={handleChange}
              placeholder="Please enter amount of nft"
            />
            <input
              type="text"
              name="description"
              disabled={editNft.status}
              value={inputValues.description}
              onChange={handleChange}
              placeholder="Please enter description"
            />
            {disableSubmit && <p>Please wait it will take few seconds.</p>}
            <button disabled={disableSubmit} type="submit">
              {disableSubmit ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            margin: "20px 0",
            flexDirection: "column",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <h5>Available NFts in Market place by different sellers</h5>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              margin: "20px 0",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {listedItems?.map((item) => {
              console.log("item : ", item);
              const hexValue = item.totalPrice._hex;
              const bigNumberValue = ethers.BigNumber.from(hexValue);
              const etherValue = ethers.utils.formatEther(bigNumberValue);
              return (
                <div key={item.itemId} style={{ border: "1px solid black" }}>
                  <img
                    width="200px"
                    height="300px"
                    src={item.image}
                    style={{ objectFit: "cover" }}
                    alt="nftImage"
                  />
                  <p>Name : {item.name}</p>
                  <p>
                    Owner :{" "}
                    {item.seller.toLowerCase() === account ? "Me" : item.seller}
                  </p>
                  <p>Amount : {item.price}</p>
                  <p>Description : {item.description}</p>
                  <p>Total Price : {etherValue}</p>
                  <button
                    onClick={() => handleChangePrice(item)}
                    disabled={item.seller.toLowerCase() !== account}
                  >
                    Change Price
                  </button>
                  <button
                    onClick={() => handlePurchaseNft(item)}
                    disabled={item.seller.toLowerCase() === account}
                  >
                    Purchase
                  </button>
                </div>
              );
            })}
          </div>

          <h5>Purchased NFts</h5>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              margin: "20px 0",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {purchasesArr?.map((item) => {
              const hexValue = item.totalPrice._hex;
              const bigNumberValue = ethers.BigNumber.from(hexValue);
              const etherValue = ethers.utils.formatEther(bigNumberValue);
              return (
                <div key={item.itemId} style={{ border: "1px solid black" }}>
                  <img
                    width="200px"
                    height="300px"
                    src={item.image}
                    style={{ objectFit: "cover" }}
                    alt="nftImage"
                  />
                  <p>Name : {item.name}</p>
                  <p>Amount : {item.price}</p>
                  <p>Description : {item.description}</p>
                  <p>Total Price : {etherValue}</p>
                  <p>Seller : {item.seller}</p>
                </div>
              );
            })}
          </div>

          <h5>Sold NFts by account holder</h5>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              margin: "20px 0",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {soldItems?.map((item) => {
              const hexValue = item.totalPrice._hex;
              const bigNumberValue = ethers.BigNumber.from(hexValue);
              const etherValue = ethers.utils.formatEther(bigNumberValue);
              return (
                <div key={item.itemId} style={{ border: "1px solid black" }}>
                  <img
                    width="200px"
                    height="300px"
                    src={item.image}
                    style={{ objectFit: "cover" }}
                    alt="nftImage"
                  />
                  <p>Name : {item.name}</p>
                  <p>Amount : {item.amount}</p>
                  <p>Description : {item.description}</p>
                  <p>Total Price : {etherValue}</p>
                  <p>Seller : {item.seller}</p>
                </div>
              );
            })}
          </div>

          <h5>Uploaded NFts by account holder</h5>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              margin: "20px 0",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {uploadedItems?.map((item) => {
              const hexValue = item.totalPrice._hex;
              const bigNumberValue = ethers.BigNumber.from(hexValue);
              const etherValue = ethers.utils.formatEther(bigNumberValue);
              return (
                <div key={item.itemId} style={{ border: "1px solid black" }}>
                  <img
                    width="200px"
                    height="300px"
                    src={item.image}
                    style={{ objectFit: "cover" }}
                    alt="nftImage"
                  />
                  <p>Name : {item.name}</p>
                  <p>Amount : {item.amount}</p>
                  <p>Status : {item.sold ? "Sold" : "Unsold"}</p>
                  <p>Description : {item.description}</p>
                  <p>Total Price : {etherValue}</p>
                  <p>Seller : {item.seller}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
