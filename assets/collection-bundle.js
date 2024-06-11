/*
    © 2023 EcomGraduates.com
    https://www.ecomgraduates.com
*/

// Get Bundle contents from localStorage
const getBundleContents = () => {
    return JSON.parse(localStorage.getItem('ecomify-bundle-v2') || '[]')
}

// Init Bundle
const initBundle = () => {
    const tiers = window.ecomify_bundle.tiers.split(',')
    const totalPrice = getBundleContents().reduce((accumulator, currentValue) =>
        (currentValue.variant_price * currentValue.quantity) + accumulator, 0)
    // console.log(totalPrice)

    document.querySelectorAll('.bundle-progress').forEach(progress => {
        const progressBar = progress.querySelector('.progress-bar')
        const progressText = progress.closest('.bundle-progress-wrapper').querySelector('.progress-text')
        const maxValue = Number(tiers[tiers.length - 1].split(':')[0] * 100)
        const width = Math.round(totalPrice / maxValue * 100)

        if (totalPrice <= maxValue) {
            progressBar.style.width = width + '%'
            progressBar.setAttribute('aria-valuenow', width)
            progressBar.classList.remove(progressBar.dataset.colorCompleted)
            progressBar.classList.add(progressBar.dataset.colorUncompleted)

            const tier = tiers.find(elem => Number(elem.split(':')[0] * 100) > totalPrice)
            const tierValue = Number(tier.split(':')[0] * 100)
            const remaining = Shopify.formatMoney(tierValue - totalPrice)
            const percentage = tier.split(':')[1] + '%'

            let textUncompleted = progressText.dataset.textUncompleted
            textUncompleted = textUncompleted.replace('[value]', `<b>${remaining}</b>`)
            textUncompleted = textUncompleted.replace('[percentage]', `<b>${percentage}</b>`)
            progressText.innerHTML = textUncompleted
            progressText.classList.remove(progressBar.dataset.colorCompleted.replace('bg-', 'text-'))
        } else {
            progressBar.style.width = '100%'
            progressBar.setAttribute('aria-valuenow', 100)
            progressBar.classList.remove(progressBar.dataset.colorUncompleted)
            progressBar.classList.add(progressBar.dataset.colorCompleted)

            const percentage = tiers[tiers.length - 1].split(':')[1] + '%'

            let textCompleted = progressText.dataset.textCompleted
            textCompleted = textCompleted.replace('[percentage]', `<b>${percentage}</b>`)
            progressText.innerHTML = textCompleted
            progressText.classList.add(progressBar.dataset.colorCompleted.replace('bg-', 'text-'))
        }
    })

    document.querySelectorAll('.bundle-btn-atc').forEach(btn => {
        btn.disabled = totalPrice === 0
    })

    document.querySelectorAll('[data-bundle-price]').forEach(elem => {
        const tier = tiers.slice().reverse().find(elem => Number(elem.split(':')[0] * 100) <= totalPrice)

        if (tier) {
            const tierDiscount = Number(tier.split(':')[1])
            const compareAtPrice = Shopify.formatMoney(totalPrice)
            const price = Shopify.formatMoney((1 - (tierDiscount / 100)) * totalPrice)
            elem.innerHTML = `<s class="text-muted fw-normal">${compareAtPrice}</s> ${price}`
        } else {
            elem.innerHTML = Shopify.formatMoney(totalPrice)
        }
    })

    document.querySelectorAll('[data-bundle-discount]').forEach(elem => {
        const tier = tiers.slice().reverse().find(elem => Number(elem.split(':')[0] * 100) < totalPrice)

        let tierDiscount = 0

        if (tier) {
            tierDiscount = Number(tier.split(':')[1])
        }

        const savings = Shopify.formatMoney(tierDiscount / 100 * totalPrice)
        elem.innerHTML = `${savings} (${tierDiscount}%)`
    })

    initBundleContents()
}
initBundle()
window.addEventListener('updated.ecomify.collection', initBundle)

// 'Add to bundle' form
window.onSubmitBundleForm = async (form, event) => {
    event.preventDefault()

    const btn = form.querySelector('.btn-atc')

    btn.innerHTML = btn.dataset.textAddedToBundle

    btn.classList.add('animate__animated', 'animate__flash')

    setTimeout(() => {
        btn.innerHTML = btn.dataset.textAddToBundle
        btn.classList.remove('animate__animated', 'animate__flash')
    }, 1500)

    const productId = Number(form.querySelector('[name="product_id"]').value)
    const productTitle = form.querySelector('[name="product_title"]').value
    const variantId = Number(form.querySelector('[name="id"]').value)
    const variantTitle = form.querySelector('[name="variant_title"]').value
    const variantPrice = Number(form.querySelector('[name="variant_price"]').value)
    const variantImage = form.querySelector('[name="variant_image"]').value

    const bundleContents = getBundleContents()

    if (bundleContents.find(elem => elem.variant_id === variantId)) {
        bundleContents.map(elem => {
            if (elem.variant_id === variantId) {
                elem.quantity += 1
            }
            return elem
        })
    } else {
        bundleContents.push({
            product_id: productId,
            product_title: productTitle,
            variant_id: variantId,
            variant_title: variantTitle,
            variant_price: variantPrice,
            variant_image: variantImage,
            quantity: 1
        })
    }

    console.log(bundleContents)

    localStorage.setItem('ecomify-bundle-v2', JSON.stringify(bundleContents))

    initBundle()
}

// Add to bundle form based on variant
window.onClickBundleFormVariant = async (btn, event) => {
    const form = btn.closest('form')

    form.querySelector('[name="id"]').value = btn.dataset.variantId
    form.querySelector('[name="variant_price"]').value = btn.dataset.variantPrice
    form.querySelector('[name="variant_image"]').value = btn.dataset.variantImage
    form.querySelector('[name="variant_title"]').value = btn.dataset.variantTitle

    window.onSubmitBundleForm(form, event)
}

// Add Bundle Contents to Cart
window.addBundleContentsToCart = async (btn) => {
    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `

    const items = getBundleContents().reduce((accumulator, currentValue) => {
        accumulator.push({
            id: currentValue.variant_id,
            quantity: currentValue.quantity
        })
        return accumulator
    }, [])

    console.log(items)

    const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            items
        })
    })

    const modal = bootstrap.Modal.getOrCreateInstance('#bundle-contents-modal')
    modal?.hide()

    localStorage.removeItem('ecomify-bundle-v2')
    initBundle()

    if (btn.dataset.redirectToCheckout === 'true') {
        window.location.href = '/checkout'
    } else {
        btn.innerHTML = window.theme.product.addedToCart

        setTimeout(() => {
            btn.innerHTML = btn.dataset.textAddToCart
        }, 2000)

        window.refreshCartContents(response)
        bootstrap.Offcanvas.getOrCreateInstance('#offcanvas-cart').show()
    }
}

// Sticky bundle card on desktop
const initStickyBundleCard = () => {
    const card = document.querySelector('#bundle-card')

    if (!card) return

    if (window.matchMedia('(min-width: 992px)').matches) {
        const navbarHeight = document.querySelector('[id*="__navbar"].sticky-top')?.clientHeight || 0
        const announcementBarHeight = document.querySelector('[id*="__announcement-bar"].sticky-top')?.clientHeight || 0

        card.style.position = 'sticky'
        card.style.zIndex = '1'

        window.addEventListener('scroll', window.throttle(() => {
            if (document.querySelector('#collection-utilities').classList.contains('sticky-top')) {
                card.style.top = `${navbarHeight + announcementBarHeight + 82}px`
            } else {
                card.style.top = `${navbarHeight + announcementBarHeight + 20}px`
            }
        }, 200))
    }
}
initStickyBundleCard()
window.addEventListener('updated.ecomify.collection', initStickyBundleCard)

// Bundle Contents Modal
function initBundleContents () {
    const modal = document.querySelector('#bundle-contents-modal')

    if (getBundleContents().length === 0) {
        modal.querySelector('.bundle-contents-empty').removeAttribute('hidden')
        modal.querySelector('.product-list').setAttribute('hidden', 'hidden')
        return
    }

    const list = modal.querySelector('.product-list')

    let listHtml = ''

    getBundleContents().forEach(elem => {
        listHtml += `
            <li class="product-item py-3">
                <div class="row align-items-center mx-n3">
                    <div class="col-4 px-3">
                        <img 
                            class="product-item-img img-fluid rounded ${list.dataset.imgThumbnail}" 
                            src="${Shopify.resizeImage(elem.variant_image || 'no-image.gif', `${list.dataset.imgWidth}x${list.dataset.imgHeight}`, 'center')}"
                            alt="" 
                            width="${list.dataset.imgWidth}"
                            height="${list.dataset.imgHeight}"
                            loading="lazy">
                    </div>
                    <div class="col-8 px-3">
                        <h3 class="product-item-title h6 mb-2">
                            ${elem.product_title}
                        </h3>
                        <p class="small text-muted mt-n1 mb-2" ${elem.variant_title.includes('Default Title') ? 'hidden' : ''}>
                            ${elem.variant_title}
                        </p>
                        <p class="product-item-price-final mb-4">
                            ${Shopify.formatMoney(elem.variant_price)}
                        </p>
                        <div class="d-flex align-items-center">
                            <div class="quantity-wrapper">
                                <button 
                                    class="btn"
                                    type="button"
                                    data-mode="minus"
                                    onclick="onClickQtyPlusMinus(this)" 
                                    aria-label="${list.dataset.textDecreaseQty}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                </button>
                                <input 
                                    class="form-control" 
                                    type="text"
                                    value="${elem.quantity}"
                                    data-min-qty="0"
                                    data-variant-id="${elem.variant_id}"
                                    aria-label="${list.dataset.textDecreaseQty}"
                                    onchange="onChangeBundleItemQty(this)">
                                <button 
                                    class="btn btn-plus"
                                    type="button"
                                    data-mode="plus"
                                    onclick="onClickQtyPlusMinus(this)"
                                    aria-label="${list.dataset.textIncreaseQty}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                </button>
                            </div>
                            <button 
                                class="btn-remove btn btn-sm ms-2"
                                onclick="onRemoveBundleItem(this)"
                                data-variant-id="${elem.variant_id}"
                                aria-label="${list.dataset.textRemove}"
                                type="button">
                                <svg xmlns="http://www.w3.org/2000/svg" class="" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </li>
        `
    })

    list.innerHTML = listHtml
    list.removeAttribute('hidden')
    modal.querySelector('.bundle-contents-empty').setAttribute('hidden', 'hidden')
}

// Quantity change (bundle contents)
window.onChangeBundleItemQty = (input, event) => {
    let bundleContents = getBundleContents()

    if (Number(input.value) === 0) {
        bundleContents = bundleContents.filter((elem) =>
            elem.variant_id !== Number(input.dataset.variantId))
    } else {
        bundleContents.map(elem => {
            if (elem.variant_id === Number(input.dataset.variantId)) {
                elem.quantity = Number(input.value)
            }
            return elem
        })
    }

    localStorage.setItem('ecomify-bundle-v2', JSON.stringify(bundleContents))

    initBundle()
}

// Remove bundle items (bundle contents)
window.onRemoveBundleItem = (btn, event) => {
    let bundleContents = getBundleContents()

    bundleContents = bundleContents.filter((elem) =>
        elem.variant_id !== Number(btn.dataset.variantId))

    localStorage.setItem('ecomify-bundle-v2', JSON.stringify(bundleContents))

    initBundle()
}

/*
    Sticky Bundle Card on mobile
*/
const initStickyBundleCardMobile = async () => {
    const wrapper = document.querySelector('#bundle-card-sticky-mobile')

    if (!wrapper) return

    await new Promise(resolve => setTimeout(resolve, 1000))

    const threshold = document.querySelector('#bundle-card').getBoundingClientRect().bottom + window.scrollY

    window.addEventListener('scroll', () => {
        if (window.scrollY > threshold) {
            wrapper.classList.add('show')
            document.body.style.paddingBottom = wrapper.clientHeight + 'px'
        } else {
            wrapper.classList.remove('show')
            document.body.style.paddingBottom = 0
        }
    })
}
initStickyBundleCardMobile()
