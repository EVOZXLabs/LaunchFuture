// ===================================================== 
// LaunchFuture Main Controller Part 1 
// Foundation 
// =====================================================

import {

    initUI,

    nextStep,

    previousStep,

    goToStep,

    setWalletConnected,

    setWalletDisconnected

} from "./ui.js";

import {

    restoreConnection,

    connectWallet,

    disconnectWallet,

    isConnected,

    getAccount

} from "./wallet.js";

import {

    initDateTime

} from "./datetime.js";

import {

    getWizardData,

    loadWizard,

    saveWizard,

    setTokenData,

    setMetadataData,

    setFeatureData

} from "./wizard.js";

import {

    buildTokenConfig,

    buildMetadata,

    deployToken,

    buildVerifyPackage

} from "./deploy.js";

import {

    isSymbolAvailable

} from "./factory.js";

import FEATURES from "./features.js";
import { loadPaymentMethods, renderPaymentCards, getSelectedPayment } from "./payment.js";
import { formatUnits } from "https://esm.sh/ethers@6";


// =====================================================
// DOM HELPERS
// =====================================================

const $ = id =>

    document.getElementById(id);

const $$ = selector =>

    [...document.querySelectorAll(selector)];


// =====================================================
// APPLICATION STATE
// =====================================================

const state = {

    step: 1,

    wallet: {

        connected: false,

        address: null

    },

    deployment: {

        fee: null,

        result: null,

        verifyPackage: null

    }

};


// =====================================================
// DOM CACHE
// =====================================================

const dom = {

    // navigation

    backButton:

        $("backButton"),

    nextButton:

        $("nextButton"),

    deployButton:

        $("deployButton"),

    stepCounter:

        $("stepCounter"),

    timeline:

        $$(".timelineStep"),

    wizardSteps:

        $$(".wizardStep"),

    // wallet

    connectWalletButton:

        $("connectWalletButton"),

    walletConnectionStatus:

        $("walletConnectionStatus"),

    walletProviderName:

        $("walletProviderName"),

    walletAddress:

        $("walletAddress"),

    walletNetwork:

        $("walletNetwork"),

    walletBalance:

        $("walletBalance"),

    walletBadge:

        $("walletBadge"),

    // token

    tokenName:

        $("tokenName"),

    tokenSymbol:

        $("tokenSymbol"),

    tokenSupply:

        $("tokenSupply"),

    tokenDecimals:

        $("tokenDecimals"),

    tokenOwner:

        $("tokenOwner"),

    paymentMethod:

        $("paymentMethod"),

    // metadata

    website:

        $("website"),

    telegram:

        $("telegram"),

    twitter:

        $("twitter"),

    // preview

    previewName:

        $("previewName"),

    previewSymbol:

        $("previewSymbol"),

    previewSupply:

        $("previewSupply"),

    previewDecimals:

        $("previewDecimals"),

    previewOwner:

        $("previewOwner"),

    previewFee:

        $("previewFee"),

    previewFeatures:

        $("previewFeatures"),

    // review

    reviewName:

        $("reviewName"),

    reviewSymbol:

        $("reviewSymbol"),

    reviewSupply:

        $("reviewSupply"),

    reviewDecimals:

        $("reviewDecimals"),

    reviewOwner:

        $("reviewOwner"),

    reviewNetwork:

        $("reviewNetwork"),

    // deploy

    deployConsole:

        $("deployConsoleOutput"),

    contractAddress:

        $("contractAddress"),

    transactionHash:

        $("transactionHash"),

    blockNumber:

        $("blockNumber")

};


// =====================================================
// SAFE SETTERS
// =====================================================

function setText(

    element,

    value = "-"

){

    if(

        element

    ){

        element.textContent =

            value;

    }

}

function setHTML(

    element,

    value = ""

){

    if(

        element

    ){

        element.innerHTML =

            value;

    }

}


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(

    "DOMContentLoaded",

    initialize

);

async function initialize(){

    try{

        initUI();

        initDateTime();

        loadWizard();

        cacheFeatureInputs();

        bindEvents();

        await initializeWallet();

    }

    catch(error){

        console.error(error);

alert(error.stack);

    }

}


// =====================================================
// FEATURE CACHE
// =====================================================

const featureInputs = {};

function cacheFeatureInputs(){

    FEATURES.forEach(

        feature=>{

            featureInputs[

                feature.id

            ] =

                $(feature.id);

        }

    );

}


// =====================================================
// WALLET
// =====================================================

async function initializeWallet(){

    await restoreConnection();

    if(

        isConnected()

    ){

        state.wallet.connected =

            true;

        state.wallet.address =

            getAccount();

        setWalletConnected({

    address:

        state.wallet.address

});

    }

    else{

        state.wallet.connected =

            false;

        state.wallet.address =

            null;

        setWalletDisconnected();

    }

}

// =====================================================
// EVENTS
// =====================================================

function bindEvents() {

    dom.nextButton?.addEventListener(

        "click",

        nextStep

    );

    dom.backButton?.addEventListener(

        "click",

        previousStep

    );

    dom.connectWalletButton?.addEventListener(

        "click",

        connectWallet

    );

    dom.timeline.forEach(

        button => {

            button.addEventListener(

                "click",

                () => {

                    goToStep(

                        Number(

                            button.dataset.step

                        )

                    );

                }

            );

        }

    );

}


// =====================================================
// PAYMENT METHODS
// =====================================================

async function initPaymentMethods() {
    try {
        await loadPaymentMethods();
        renderPaymentCards("paymentCards", (pm) => {
            // Update hint
            const hint = document.getElementById("paymentHint");
            if (hint) {
                if (pm.isNative) {
                    hint.textContent = `Pay ${formatUnits(pm.fee, 18)} ${pm.symbol} native coin directly from your wallet.`;
                } else {
                    hint.textContent = `Pay with ${pm.symbol} ERC-20 token. A gasless EIP-712 permit signature will be requested.`;
                }
            }
            // Update preview fee
            const feeEl = document.getElementById("previewFee");
            if (feeEl) {
                const feeNum = parseFloat(formatUnits(pm.fee, 18));
                feeEl.textContent = feeNum === 0 ? "Free" : `${feeNum % 1 === 0 ? feeNum.toFixed(0) : feeNum.toPrecision(6)} ${pm.symbol}`;
            }
        });
    } catch (err) {
        const cards = document.getElementById("paymentCards");
        if (cards) cards.innerHTML = '<div class="paymentEmpty"><p>Could not load payment methods. Make sure you are on the right network.</p></div>';
        console.error("Payment init error:", err);
    }
}

