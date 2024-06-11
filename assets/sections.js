/*
    © 2023 EcomGraduates.com
    https://www.ecomgraduates.com
*/

/*
    Announcement bar
*/
const initStickyAnnouncementBar = () => {
    const section = document.querySelector('.announcement-bar-sticky')
    if (!section) return

    section.closest('.shopify-section').classList.add('sticky-top')

    const navbar = document.querySelector('[id*="__navbar"].sticky-top')
    if (!navbar) return

    navbar.style.top = document.querySelector('.announcement-bar-sticky').clientHeight + 'px'
}
initStickyAnnouncementBar()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.announcement-bar-sticky')) {
        initStickyAnnouncementBar()
    }
})

document.addEventListener('shopify:block:select', (event) => {
    const carousel = event.target.closest('.announcement-bar .carousel')

    if (carousel) {
        bootstrap.Carousel.getOrCreateInstance(carousel, { ride: false })
            .to(event.target.dataset.index)
    }
})

/*
    Carousel
*/
document.addEventListener('shopify:block:select', (event) => {
    const carousel = event.target.closest('.carousel')

    if (carousel) {
        bootstrap.Carousel.getOrCreateInstance(carousel, { ride: false })
            .to(event.target.dataset.index)
    }
})

/*
    Marquee
*/
const initMarqueeSections = () => {
    document.querySelectorAll('.marquee').forEach(section => {
        const list = section.querySelector('ul')
        const marqueeWidth = list.scrollWidth
        const marqueeLength = list.querySelectorAll('li').length

        list.insertAdjacentHTML('beforeEnd', list.innerHTML)
        list.insertAdjacentHTML('beforeEnd', list.innerHTML)

        list.querySelectorAll('li').forEach((item, index) => {
            if (index >= marqueeLength) {
                item.setAttribute('aria-hidden', 'true')
            }
        })

        let translateX = `-${marqueeWidth}`

        if (document.documentElement.getAttribute('dir') === 'rtl') {
            translateX = `${marqueeWidth}`
        }

        let style = `
            <style>
                #marquee-${list.dataset.sectionId} ul {
                    animation-name: marquee-animation-${list.dataset.sectionId};
                    animation-duration: ${list.dataset.animationDuration}s;
                }
                @keyframes marquee-animation-${list.dataset.sectionId} {
                    to { transform: translateX(${translateX}px); }
                }
            </style>
        `
        if (list.dataset.marqueeDirection === 'right') {
            style += `
                <style>
                    @keyframes marquee-animation-${list.dataset.sectionId} {
                        from { transform: translateX(${translateX}px); }    
                        to { transform: 0); }    
                    }
                </style>
            `
        }

        list.insertAdjacentHTML('beforeBegin', style)
    })
}
initMarqueeSections()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.marquee')) {
        initMarqueeSections()
    }
})

/*
    Featured Products
*/
const initFeaturedProducts = () => {
    document.querySelectorAll('.featured-products:not(.init)').forEach(section => {
        section.classList.add('init')

        const element = section.querySelector('.splide')

        if (!element) {
            return
        }

        const mySplide = new Splide(element, {
            arrows: element.dataset.arrows === 'true',
            pagination: element.dataset.pagination === 'true',
            easing: element.dataset.easing,
            speed: Number(element.dataset.speed),
            perMove: Number(element.dataset.perMove),
            autoplay: element.dataset.autoplay === 'true',
            interval: Number(element.dataset.interval),
            per_move: Number(element.dataset.perMove),
            rewind: element.dataset.rewind === 'true',
            mediaQuery: 'min',
            breakpoints: {
                0: { perPage: Number(element.dataset.breakpointXs), padding: element.dataset.breakpointXsPartial === 'true' ? { right: '16%' } : 0 },
                576: { perPage: Number(element.dataset.breakpointSm), padding: 0 },
                768: { perPage: Number(element.dataset.breakpointMd), padding: 0 },
                992: { perPage: Number(element.dataset.breakpointLg), padding: 0 },
                1200: { perPage: Number(element.dataset.breakpointXl), padding: 0 },
                1400: { perPage: Number(element.dataset.breakpointXxl), padding: 0 }
            },
            direction: document.documentElement.getAttribute('dir')
        })

        const fixArrowsPos = () => {
            let top = section.querySelector('.product-item-img')?.clientHeight / 2

            if (section.querySelector('.product-item .card')) {
                top = section.querySelector('.card')?.clientHeight / 2
            }

            section.querySelectorAll('.splide__arrow').forEach(arrow => {
                arrow.style.top = `${top}px`
            })
        }

        const fixPagination = () => {
            if (window.matchMedia('(max-width: 575px').matches) {
                const pagination = section.querySelector('.splide__pagination')

                if (!pagination) return

                section.querySelector('.splide__pagination--mobile')?.remove()

                const total = pagination.querySelectorAll('button').length

                let text = element.dataset.textSlideOf.replace('[x]', mySplide.index + 1)
                text = text.replace('[total]', total)

                pagination.insertAdjacentHTML('beforebegin', `
                    <div class="splide__pagination--mobile text-muted small">
                        ${text}
                    </div>
                `)
            }
        }

        mySplide.on('ready resize', () => {
            fixArrowsPos()
            fixPagination()
        })

        mySplide.on('move', () => {
            fixPagination()
        })

        mySplide.mount()
    })
}
initFeaturedProducts()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.featured-products')) {
        initFeaturedProducts()
    }
})

/*
    Recommended Products
    https://shopify.dev/themes/product-merchandising/recommendations
*/
const initRecommendedProducts = async () => {
    const section = document.querySelector('.recommended-products')

    if (!section) return

    const { sectionId, baseUrl, productId, limit, intent } = section.dataset
    const url = `${baseUrl}?section_id=${sectionId}&product_id=${productId}&limit=${limit}&intent=${intent}`
    const response = await fetch(url)
    const data = await response.text()

    section.closest('.shopify-section').outerHTML = data

    document.querySelectorAll('.recommended-products [data-bs-toggle="popover"]')
        .forEach((el) => bootstrap.Popover.getOrCreateInstance(el))

    initFeaturedProducts()

    const customEvent = new CustomEvent('init.ecomify.recommended_products')
    window.dispatchEvent(customEvent)
}
initRecommendedProducts()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.recommended-products')) {
        initRecommendedProducts()
    }
})

/*
    Recently Viewed
*/
const initRecentlyViewed = async () => {
    const localStorageKey = 'ecomify_recently_viewed_v1'

    document.querySelectorAll('.recently-viewed:not(.init2)').forEach(section => {
        section.classList.add('init2')

        const recentlyViewed = JSON.parse(localStorage.getItem(localStorageKey)) || []

        let productListItems = ''

        recentlyViewed.forEach((product, index) => {
            if (index + 1 <= Number(section.dataset.limit)) {
                let variantOptions = ''

                product.variants.forEach((variant) => {
                    variantOptions += `
                        <option 
                            value="${variant.id}"
                            data-compare-at-price="${variant.compare_at_price || ''}"
                            data-price="${variant.price}"
                            data-variant-image="${variant.featured_image.src ? Shopify.resizeImage(variant.featured_image.src, `${section.dataset.imgWidth}x${section.dataset.imgHeight}`, 'center') : ''}">
                            ${variant.title}
                        </option>
                    `
                })

                productListItems += `
                    <li class="product-item splide__slide p-3 p-lg-4 mb-4">
                        <a 
                            class="product-link position-relative d-block link-dark" 
                            href="${product.url}">
                            <img 
                                class="product-item-img img-fluid mb-4 rounded ${section.dataset.imgThumbnail}" 
                                src="${Shopify.resizeImage(product.featured_image || 'no-image.gif', `${section.dataset.imgWidth}x${section.dataset.imgHeight}`, 'center')}"
                                alt="" 
                                width="${section.dataset.imgWidth}"
                                height="${section.dataset.imgHeight}"
                                loading="lazy">
                            <h3 class="product-item-title mb-2 ${section.dataset.productTitleSize} ${section.dataset.productTitleTruncate}">
                                ${product.title}
                            </h3>
                        </a>
                        <div class="shopify-product-reviews-badge" data-id="${product.id}"></div>
                        <p class="product-item-price mb-4">
                            <span ${product.compare_at_price > product.price ? '' : 'hidden'}>
                                <span class="product-item-price-compare text-muted me-1">
                                    <span class="visually-hidden">
                                        ${section.dataset.textPriceRegular} &nbsp;
                                    </span>
                                    <s>
                                        ${Shopify.formatMoney(product.compare_at_price)}
                                    </s>
                                </span>
                                <span class="product-item-price-final">
                                    <span class="visually-hidden">
                                        ${section.dataset.textPriceSale} &nbsp;
                                    </span>
                                    <span ${product.price_varies ? '' : 'hidden'}>
                                        ${section.dataset.textPriceFrom}
                                    </span>
                                    ${Shopify.formatMoney(product.price)}
                                </span>
                            </span>
                            <span class="product-item-price-final" ${product.compare_at_price > product.price ? 'hidden' : ''}>
                                <span ${product.price_varies ? '' : 'hidden'}>
                                    ${section.dataset.textPriceFrom}
                                </span>
                                ${Shopify.formatMoney(product.price)}
                            </span>
                        </p>
                        <div class="mb-2" ${section.dataset.showAtcForm === 'true' ? '' : 'hidden'}>
                            <form method="post" action="/cart/add" accept-charset="UTF-8" class="shopify-product-form" enctype="multipart/form-data" onsubmit="onSubmitAtcForm(this, event)">
                                <input type="hidden" name="form_type" value="product">
                                <input type="hidden" name="utf8" value="✓">
                                <select 
                                    class="form-select w-100 mb-3" 
                                    name="id" 
                                    aria-label="${section.dataset.textSelectVariant}"
                                    onchange="onChangeProductItemVariant(this, event)"
                                    ${product.variants.length === 1 ? 'hidden' : ''}>
                                    ${variantOptions}
                                </select>
                                <button
                                    class="btn-atc btn btn-md btn-primary w-100" 
                                    type="submit"
                                    name="add"
                                    data-text-add-to-cart="${section.dataset.textAddToCart}">
                                    ${section.dataset.textAddToCart}
                                </button>
                            </form>
                        </div>
                        <div class="" ${section.dataset.showWishlist === 'true' ? '' : 'hidden'}>
                            <button 
                                class="btn-wishlist-add-remove btn btn-sm w-100"
                                type="button"
                                data-product-handle="${product.handle}"
                                data-text-add="${section.dataset.textWishlistAdd}"
                                data-text-remove="${section.dataset.textWishlistRemove}"
                                aria-label="${section.dataset.textWishlistAdd}"
                                onclick="addOrRemoveFromWishlist(this)">
                                <svg xmlns="http://www.w3.org/2000/svg" class="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                <span>${section.dataset.textWishlistBtnLabel}</span>
                            </button>
                        </div>
                    </li>
                `
            }
        })

        section.querySelector('.product-list').innerHTML = productListItems

        window.SPR?.initDomEls()
        window.SPR?.loadBadges()

        if (recentlyViewed.length > 0) {
            section.removeAttribute('hidden')
        }

        section.classList.remove('init')
        initFeaturedProducts()
    })

    if (document.body.classList.contains('page-type-product')) {
        const productHandle = document.querySelector('#product-template').dataset.productHandle

        const response = await fetch(`${productHandle}.js`)
        const product = await response.json()
        // console.log(product)

        let recentlyViewed = JSON.parse(localStorage.getItem(localStorageKey)) || []
        const isViewed = recentlyViewed.some((elem) => elem.handle === product.handle)

        if (isViewed) {
            recentlyViewed = recentlyViewed.filter(elem => elem.handle !== product.handle)
        }

        const variants = product.variants.map(variant =>
            ({
                id: variant.id,
                title: variant.title,
                compare_at_price: variant.compare_at_price,
                price: variant.price,
                featured_image: {
                    src: variant.featured_image?.src || null
                }
            })
        )

        recentlyViewed.unshift({
            id: product.id,
            handle: product.handle,
            url: product.url,
            title: product.title,
            compare_at_price: product.compare_at_price,
            price: product.price,
            price_varies: product.price_varies,
            featured_image: product.featured_image,
            vendor: product.vendor,
            time: Date.now(),
            variants
        })

        if (recentlyViewed.length > 50) {
            recentlyViewed.pop()
        }

        localStorage.setItem(localStorageKey, JSON.stringify(recentlyViewed))
    }
}
initRecentlyViewed()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.recently-viewed')) {
        initRecentlyViewed()
    }
})

/*
    Recently Wishlisted
*/
const initRecentlyWishlisted = async () => {
    const localStorageKey = 'ecomify_wishlist_v1'

    document.querySelectorAll('.recently-wishlisted:not(.init3)').forEach(section => {
        section.classList.add('init3')

        const recentlyWishlisted = JSON.parse(localStorage.getItem(localStorageKey)) || []

        let productListItems = ''

        recentlyWishlisted.forEach((product, index) => {
            if (index + 1 <= Number(section.dataset.limit)) {
                let variantOptions = ''

                product.variants.forEach(variant => {
                    variantOptions += `
                        <option 
                            value="${variant.id}"
                            data-compare-at-price="${variant.compare_at_price || ''}"
                            data-price="${variant.price}"
                            data-variant-image="${variant.featured_image.src ? Shopify.resizeImage(variant.featured_image.src, `${section.dataset.imgWidth}x${section.dataset.imgHeight}`, 'center') : ''}">
                            ${variant.title}
                        </option>
                    `
                })

                productListItems += `
                    <li class="product-item splide__slide p-3 p-lg-4 mb-4">
                        <a 
                            class="product-link position-relative d-block link-dark" 
                            href="${product.url}">
                            <img 
                                class="product-item-img img-fluid mb-4 rounded ${section.dataset.imgThumbnail}" 
                                src="${Shopify.resizeImage(product.featured_image || 'no-image.gif', `${section.dataset.imgWidth}x${section.dataset.imgHeight}`, 'center')}"
                                alt="" 
                                width="${section.dataset.imgWidth}"
                                height="${section.dataset.imgHeight}"
                                loading="lazy">
                            <h3 class="product-item-title mb-2 ${section.dataset.productTitleSize} ${section.dataset.productTitleTruncate}">
                                ${product.title}
                            </h3>
                        </a>
                        <div class="shopify-product-reviews-badge" data-id="${product.id}"></div>
                        <p class="product-item-price mb-4">
                            <span ${product.compare_at_price > product.price ? '' : 'hidden'}>
                                <span class="product-item-price-compare text-muted me-1">
                                    <span class="visually-hidden">
                                        ${section.dataset.textPriceRegular} &nbsp;
                                    </span>
                                    <s>
                                        ${Shopify.formatMoney(product.compare_at_price)}
                                    </s>
                                </span>
                                <span class="product-item-price-final">
                                    <span class="visually-hidden">
                                        ${section.dataset.textPriceSale} &nbsp;
                                    </span>
                                    <span ${product.price_varies ? '' : 'hidden'}>
                                        ${section.dataset.textPriceFrom}
                                    </span>
                                    ${Shopify.formatMoney(product.price)}
                                </span>
                            </span>
                            <span class="product-item-price-final" ${product.compare_at_price > product.price ? 'hidden' : ''}>
                                <span ${product.price_varies ? '' : 'hidden'}>
                                    ${section.dataset.textPriceFrom}
                                </span>
                                ${Shopify.formatMoney(product.price)}
                            </span>
                        </p>
                        <div class="mb-2" ${section.dataset.showAtcForm === 'true' ? '' : 'hidden'}>
                            <form method="post" action="/cart/add" accept-charset="UTF-8" class="shopify-product-form" enctype="multipart/form-data" onsubmit="onSubmitAtcForm(this, event)">
                                <input type="hidden" name="form_type" value="product">
                                <input type="hidden" name="utf8" value="✓">
                                <select 
                                    class="form-select w-100 mb-3" 
                                    name="id" 
                                    aria-label="${section.dataset.textSelectVariant}"
                                    onchange="onChangeProductItemVariant(this, event)"
                                    ${product.variants.length === 1 ? 'hidden' : ''}>
                                    ${variantOptions}
                                </select>
                                <button
                                    class="btn-atc btn btn-md btn-primary w-100" 
                                    type="submit"
                                    name="add"
                                    data-text-add-to-cart="${section.dataset.textAddToCart}">
                                    ${section.dataset.textAddToCart}
                                </button>
                            </form>
                        </div>
                        <div class="" ${section.dataset.showWishlist === 'true' ? '' : 'hidden'}">
                            <button 
                                class="btn-wishlist-add-remove btn btn-sm w-100"
                                type="button"
                                data-product-handle="${product.handle}"
                                data-text-add="${section.dataset.textWishlistAdd}"
                                data-text-remove="${section.dataset.textWishlistRemove}"
                                aria-label="${section.dataset.textWishlistAdd}"
                                onclick="addOrRemoveFromWishlist(this)">
                                <svg xmlns="http://www.w3.org/2000/svg" class="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                <span>${section.dataset.textWishlistBtnLabel}</span>
                            </button>
                        </div>
                    </li>
                `
            }
        })

        section.querySelector('.product-list').innerHTML = productListItems

        window.SPR?.initDomEls()
        window.SPR?.loadBadges()

        if (recentlyWishlisted.length > 0) {
            section.removeAttribute('hidden')
        }

        section.classList.remove('init')
        initFeaturedProducts()
    })
}
initRecentlyWishlisted()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.recently-wishlisted')) {
        initRecentlyWishlisted()
    }
})

/*
    Testimonials
*/
const initTestimonials = () => {
    document.querySelectorAll('.testimonials').forEach(section => {
        const element = section.querySelector('.splide')

        const mySplide = new Splide(element, {
            type: element.dataset.loop === 'true' ? 'loop' : 'slide',
            arrows: element.dataset.arrows === 'true',
            pagination: element.dataset.pagination === 'true',
            easing: element.dataset.easing,
            speed: Number(element.dataset.speed),
            perMove: Number(element.dataset.perMove),
            autoplay: element.dataset.autoplay === 'true',
            interval: Number(element.dataset.interval),
            per_move: Number(element.dataset.perMove),
            rewind: element.dataset.rewind === 'true',
            mediaQuery: 'min',
            breakpoints: {
                0: { perPage: Number(element.dataset.breakpointXs), padding: '10%' },
                576: { perPage: Number(element.dataset.breakpointSm), padding: 0 },
                768: { perPage: Number(element.dataset.breakpointMd), padding: 0 },
                992: { perPage: Number(element.dataset.breakpointLg), padding: 0 },
                1200: { perPage: Number(element.dataset.breakpointXl), padding: 0 },
                1400: { perPage: Number(element.dataset.breakpointXxl), padding: 0 }
            },
            direction: document.documentElement.getAttribute('dir')
        })

        const fixArrowsPos = () => {
            const top = section.querySelector('.card').clientHeight / 2
            section.querySelectorAll('.splide__arrow').forEach(arrow => {
                arrow.style.top = `${top}px`
            })
        }

        const fixPagination = () => {
            if (window.matchMedia('(max-width: 575px').matches) {
                const pagination = section.querySelector('.splide__pagination')

                if (!pagination) return

                section.querySelector('.splide__pagination--mobile')?.remove()

                const total = pagination.querySelectorAll('button').length

                let text = element.dataset.textSlideOf.replace('[x]', mySplide.index + 1)
                text = text.replace('[total]', total)

                pagination.insertAdjacentHTML('beforebegin', `
                    <div class="splide__pagination--mobile text-muted small">
                        ${text}
                    </div>
                `)
            }
        }

        mySplide.on('ready resize', () => {
            fixArrowsPos()
            fixPagination()
        })

        mySplide.on('move', () => {
            fixPagination()
        })

        mySplide.mount()
    })
}
initTestimonials()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.testimonials')) {
        initTestimonials()
    }
})

/*
    Instagram Gallery
*/
const initInstagramGallery = () => {
    document.querySelectorAll('.instagram-gallery').forEach(async (section, index) => {
        if (index === 0) {
            const splideScrollScript = document.createElement('script')
            splideScrollScript.src = section.dataset.vendorSplideScrollScript
            document.head.appendChild(splideScrollScript)

            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        const element = section.querySelector('.splide')

        let speed = Number(element.dataset.speed)

        if (element.dataset.direction === 'right') {
            speed = -Math.abs(speed)
        }

        const mySplide = new Splide(element, {
            type: 'loop',
            drag: 'free',
            focus: 'center',
            arrows: element.dataset.arrows === 'true',
            pagination: false,
            easing: element.dataset.easing,
            gap: Number(element.dataset.gap),
            mediaQuery: 'min',
            breakpoints: {
                0: { perPage: Number(element.dataset.breakpointXs), padding: 0 },
                576: { perPage: Number(element.dataset.breakpointSm), padding: 0 },
                768: { perPage: Number(element.dataset.breakpointMd), padding: 0 },
                992: { perPage: Number(element.dataset.breakpointLg), padding: 0 },
                1200: { perPage: Number(element.dataset.breakpointXl), padding: 0 },
                1400: { perPage: Number(element.dataset.breakpointXxl), padding: 0 }
            },
            autoScroll: {
                speed
            },
            direction: document.documentElement.getAttribute('dir')
        })
        mySplide.mount(window.splide.Extensions)
    })
}
initInstagramGallery()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.instagram-gallery')) {
        initInstagramGallery()
    }
})

/*
    TikTok Slider
*/
const initTikTokSlider = () => {
    document.querySelectorAll('.tiktok-slider').forEach(section => {
        const element = section.querySelector('.splide')

        const mySplide = new Splide(element, {
            arrows: element.dataset.arrows === 'true',
            pagination: false,
            easing: element.dataset.easing,
            perMove: Number(element.dataset.perMove),
            autoplay: element.dataset.autoplay === 'true',
            interval: Number(element.dataset.interval),
            per_move: Number(element.dataset.perMove),
            rewind: element.dataset.rewind === 'true',
            gap: Number(element.dataset.gap),
            mediaQuery: 'min',
            breakpoints: {
                0: { perPage: Number(element.dataset.breakpointXs), padding: '15%' },
                576: { perPage: Number(element.dataset.breakpointSm), padding: 0 },
                768: { perPage: Number(element.dataset.breakpointMd), padding: 0 },
                992: { perPage: Number(element.dataset.breakpointLg), padding: 0 },
                1200: { perPage: Number(element.dataset.breakpointXl), padding: 0 },
                1400: { perPage: Number(element.dataset.breakpointXxl), padding: 0 }
            },
            direction: document.documentElement.getAttribute('dir')
        })
        mySplide.mount()

        section.querySelectorAll('video').forEach(video => {
            const videoWrapper = video.closest('.video-wrapper')
            const soundBtn = videoWrapper.querySelector('[data-toggle-sound]')

            video.addEventListener('click', (e) => {
                section.querySelectorAll(`video:not([data-index="${video.dataset.index}"])`).forEach(video => {
                    video.pause()
                    video.closest('.video-wrapper').classList.remove('is-playing')
                })

                if (videoWrapper.classList.contains('is-playing')) {
                    video.pause()
                    videoWrapper.classList.remove('is-playing')
                } else {
                    video.play()
                    videoWrapper.classList.add('is-playing')

                    if (section.dataset.volume === 'on') {
                        video.muted = false
                        soundBtn.querySelector('.icon-volume-off').setAttribute('hidden', 'hidden')
                        soundBtn.querySelector('.icon-volume-on').removeAttribute('hidden')
                    }
                }
            })

            soundBtn?.addEventListener('click', () => {
                video.muted = !video.muted

                if (video.muted) {
                    soundBtn.querySelector('.icon-volume-off').removeAttribute('hidden')
                    soundBtn.querySelector('.icon-volume-on').setAttribute('hidden', 'hidden')
                    section.setAttribute('data-volume', 'off')
                } else {
                    soundBtn.querySelector('.icon-volume-off').setAttribute('hidden', 'hidden')
                    soundBtn.querySelector('.icon-volume-on').removeAttribute('hidden')
                    section.setAttribute('data-volume', 'on')
                }
            })
        })

        mySplide.on('moved', (newIndex, prevIndex) => {
            const video = section.querySelector(`video[data-index="${newIndex}"]`)
            const videoWrapper = video.closest('.video-wrapper')
            const soundBtn = videoWrapper.querySelector('[data-toggle-sound]')

            if (video) {
                section.querySelectorAll(`video:not([data-index="${newIndex}"])`).forEach(video => {
                    video.muted = true
                    video.pause()
                    video.closest('.video-wrapper').classList.remove('is-playing')
                })

                video.play()

                videoWrapper.classList.add('is-playing')

                if (section.dataset.volume === 'on' && !navigator.userAgent.match(/(iPad|iPhone)/g)) {
                    video.muted = false
                    soundBtn.querySelector('.icon-volume-off').setAttribute('hidden', 'hidden')
                    soundBtn.querySelector('.icon-volume-on').removeAttribute('hidden')
                }
            }
        })
    })
}
initTikTokSlider()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.tiktok-slider')) {
        initTikTokSlider()
    }
})

/*
    Parallax image
*/
const initParallaxImage = () => {
    document.querySelectorAll('.parallax-image').forEach(async (section, index) => {
        if (index === 0) {
            const vendorScript = document.createElement('script')
            vendorScript.src = section.dataset.vendorScript
            document.head.appendChild(vendorScript)

            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        const imgMobile = section.querySelector('.img-mobile')
        const imgDesktop = section.querySelector('.img-desktop')

        // eslint-disable-next-line new-cap, no-new
        new simpleParallax(imgMobile, {
            orientation: imgMobile.dataset.orientation,
            scale: Number(imgMobile.dataset.scale / 100)
            // maxTransition: 80
        })

        // eslint-disable-next-line new-cap, no-new
        new simpleParallax(imgDesktop, {
            orientation: imgDesktop.dataset.orientation,
            scale: Number(imgDesktop.dataset.scale / 100)
        })
    })
}
initParallaxImage()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.parallax-image')) {
        initParallaxImage()
    }
})

/*
    Sticky ATC
*/
const initStickyAtc = async () => {
    const wrapper = document.querySelector('#sticky-atc')

    if (!wrapper) return

    await new Promise(resolve => setTimeout(resolve, 1000))

    const threshold = document.querySelector('.product-content form[action*="/cart/add"]').getBoundingClientRect().bottom + window.scrollY

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
initStickyAtc()

/*
    Newsletter Popup
*/
const initNewsletterPopup = async () => {
    if (Shopify.designMode) return

    const modal = document.querySelector('#newsletter-popup-modal')
    if (!modal) return

    const bsModal = bootstrap.Modal.getOrCreateInstance(modal)

    if (window.location.href.includes('newsletter-popup')) {
        bsModal.show()
        return
    }

    if (document.cookie.indexOf('ecomify-newsletter-popup') > -1) return

    await new Promise(resolve => setTimeout(resolve, Number(modal.dataset.delay) * 1000))

    window.createCookie('ecomify-newsletter-popup', true, Number(modal.dataset.daysToWait))

    bsModal.show()
}
initNewsletterPopup()

document.addEventListener('shopify:section:select', (e) => {
    if (e.target.querySelector('#newsletter-popup-modal')) {
        const bsModal = bootstrap.Modal.getOrCreateInstance('#newsletter-popup-modal')
        bsModal.hide()
        bsModal.show()
    }
})

/*
    Animated Stories
*/
const initAnimatedStories = () => {
    const localStorageKeyMain = 'ecomify_animated_stories'
    const localStorageKeyTime = 'ecomify_animated_stories_time'

    document.querySelectorAll('.animated-stories-link').forEach(link => {
        let storiesRead = JSON.parse(localStorage.getItem(localStorageKeyMain)) || []

        if (new Date().getTime() > Number(localStorage.getItem(localStorageKeyTime)) + 8.64e+7) {
            storiesRead = []
        }

        const storyIsRead = storiesRead.some((elem) => elem === link.getAttribute('href'))

        if (storyIsRead) {
            link.classList.add('story-is-read')
        }

        link.addEventListener('click', (e) => {
            if (!storyIsRead) {
                storiesRead.push(link.getAttribute('href'))
            }

            localStorage.setItem(localStorageKeyMain, JSON.stringify(storiesRead))
            localStorage.setItem(localStorageKeyTime, new Date().getTime())
        })
    })
}
initAnimatedStories()

/*
    Image Compare
*/
const initImageCompare = () => {
    document.onreadystatechange = () => {
        if (document.readyState === 'complete') {
            document.querySelectorAll('.image-compare-slider').forEach(slider => {
                new ImageCompare(slider, {
                    controlColor: slider.dataset.controlColor,
                    controlShadow: true,
                    addCircle: slider.dataset.addCircle === 'true',
                    addCircleBlur: false,
                    showLabels: slider.dataset.showLabels === 'true',
                    labelOptions: {
                        before: slider.dataset.labelBefore,
                        after: slider.dataset.labelAfter,
                        onHover: slider.dataset.labelOnHover === 'true'
                    },
                    smoothing: slider.dataset.smoothing === 'true',
                    smoothingAmount: Number(slider.dataset.smoothingAmount),
                    hoverStart: slider.dataset.hoverStart === 'true',
                    verticalMode: slider.dataset.verticalMode === 'true',
                    startingPoint: Number(slider.dataset.startingPoint),
                    fluidMode: false
                }).mount()
            })
        }
    }
}
initImageCompare()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.image-compare-slider')) {
        initImageCompare()
    }
})

// Quiz
const initQuiz = () => {
    document.querySelectorAll('section.quiz').forEach(quiz => {
        const quizHeader = quiz.querySelector('.quiz-header')
        const quizItems = quiz.querySelector('.quiz-items')
        const prevBtn = quiz.querySelector('.btn-quiz-prev')
        const progressBar = quiz.querySelector('.progress-bar')
        const progressBarText = quiz.querySelector('.progress-bar-text')
        const results = quiz.querySelector('.quiz-results')

        const selectedValues = []

        progressBar.style.width = 100 / Number(progressBar.dataset.total) + '%'

        quizItems.querySelectorAll('.btn-quiz-value').forEach(btn => {
            btn.addEventListener('click', () => {
                const block = btn.closest('[data-question')

                quiz.querySelectorAll('.quiz-items .btn-quiz-value').forEach(btn => {
                    btn.classList.remove('active')
                    btn.setAttribute('aria-current', 'false')
                })

                btn.classList.add('active')
                btn.setAttribute('aria-current', 'step')

                setTimeout(() => {
                    block.setAttribute('hidden', 'hidden')
                    block.nextElementSibling?.removeAttribute('hidden')
                    block.nextElementSibling?.querySelector('.title').focus()

                    prevBtn.removeAttribute('hidden')
                    progressBar.style.width = (Number(block.dataset.question) + 1) / Number(progressBar.dataset.total) * 100 + '%'
                    progressBarText.querySelector('span').textContent = Number(block.dataset.question) + 1

                    selectedValues.push(btn.dataset.value)

                    if (Number(block.dataset.question) === Number(progressBar.dataset.total)) {
                        quizHeader.remove()
                        quizItems.remove()
                        progressBar.closest('.progress').remove()
                        progressBarText.remove()
                        prevBtn.remove()

                        results.removeAttribute('hidden')

                        console.log(selectedValues)

                        results.querySelectorAll('.product-list').forEach(prouductList => {
                            let listValues = prouductList.dataset.values.split(',')
                            listValues = listValues.map(e => String(e).trim())

                            console.log(listValues)
                            console.log(selectedValues)

                            if (selectedValues.every(item => listValues.includes(item))) {
                                prouductList.removeAttribute('hidden')
                            }
                        })
                    }
                }, 500)
            })
        })

        quiz.querySelector('.btn-quiz-prev').addEventListener('click', () => {
            const currentBlock = quiz.querySelector('[data-question]:not([hidden]')

            currentBlock.setAttribute('hidden', 'hidden')
            currentBlock.previousElementSibling.removeAttribute('hidden')

            if (Number(currentBlock.dataset.question) === 2) {
                prevBtn.setAttribute('hidden', 'hidden')
            }

            progressBar.style.width = (Number(currentBlock.dataset.question) - 2) / Number(progressBar.dataset.total) * 100 + '%'
            progressBarText.querySelector('span').textContent = Number(currentBlock.dataset.question) - 1

            selectedValues.pop()
        })
    })
}
initQuiz()

/*
    Brands
*/
const initBrands = () => {
    document.querySelectorAll('section.brands').forEach(section => {
        section.querySelectorAll('.brand-all-letters button').forEach(btn => {
            btn.addEventListener('click', () => {
                section.querySelectorAll('.brand-list li.brand-list-item').forEach(item => {
                    if (btn.dataset.letter === 'ALL') {
                        item.removeAttribute('hidden')
                    } else {
                        if (item.dataset.letter === btn.dataset.letter) {
                            item.removeAttribute('hidden')
                        } else {
                            item.setAttribute('hidden', 'hidden')
                        }
                    }
                })

                section.querySelectorAll('.brand-all-letters button').forEach(elem => {
                    if (elem.dataset.letter === btn.dataset.letter) {
                        elem.classList.add('active')
                    } else {
                        elem.classList.remove('active')
                    }
                })
            })
        })
    })
}
initBrands()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('section.brands')) {
        initBrands()
    }
})

/*
    Sticky video
*/
const initStickyVideo = () => {
    if (Shopify.designMode) return

    document.querySelectorAll('.sticky-video').forEach(section => {
        const delay = window.localStorage.getItem('ecomify-sticky-video-delay')

        let show = false

        if (delay) {
            if (Date.now() >= delay) {
                show = true
            }
        } else {
            show = true
        }

        if (show) {
            setTimeout(() => {
                section.classList.add('show')
            }, Number(section.dataset.showAfter) * 1000)
        }

        const closeBtn = section.querySelector('.btn-close-custom')

        closeBtn.addEventListener('click', () => {
            section.classList.remove('show')

            const closingDelayInHours = Number(section.dataset.closingDelay)
            window.localStorage.setItem('ecomify-sticky-video-delay', Date.now() + (closingDelayInHours * 3600000))
        })
    })
}
initStickyVideo()

document.addEventListener('shopify:section:select', (e) => {
    if (e.target.querySelector('.sticky-video')) {
        document.querySelector('.sticky-video').classList.add('show')
    } else {
        document.querySelector('.sticky-video').classList.remove('show')
    }
})

/*
    Video Slider
*/
const initVideoSlider = () => {
    document.querySelectorAll('.video-slider').forEach(async (section, index) => {
        if (index === 0) {
            const splideVideoScript = document.createElement('script')
            splideVideoScript.src = section.dataset.vendorSplideVideoScript
            document.head.appendChild(splideVideoScript)

            document.getElementsByTagName('head')[0].insertAdjacentHTML(
                'beforeend',
                `<link rel="stylesheet" href="${section.dataset.vendorSplideVideoStylesheet}" />`)

            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        const element = section.querySelector('.splide')

        const mySplide = new Splide(element, {
            type: element.dataset.loop === 'true' ? 'loop' : 'slide',
            arrows: element.dataset.arrows === 'true',
            pagination: element.dataset.pagination === 'true',
            easing: element.dataset.easing,
            speed: Number(element.dataset.speed),
            perMove: Number(element.dataset.perMove),
            autoplay: element.dataset.autoplay === 'true',
            interval: Number(element.dataset.interval),
            per_move: Number(element.dataset.perMove),
            rewind: element.dataset.rewind === 'true',
            mediaQuery: 'min',
            breakpoints: {
                0: { perPage: Number(element.dataset.breakpointXs), padding: 0 },
                576: { perPage: Number(element.dataset.breakpointSm), padding: 0 },
                768: { perPage: Number(element.dataset.breakpointMd), padding: 0 },
                992: { perPage: Number(element.dataset.breakpointLg), padding: 0 },
                1200: { perPage: Number(element.dataset.breakpointXl), padding: 0 },
                1400: { perPage: Number(element.dataset.breakpointXxl), padding: 0 }
            },
            video: {
                loop: true
            },
            autoScroll: false,
            direction: document.documentElement.getAttribute('dir')
        })

        const fixArrowsPos = () => {
            const top = section.querySelector('.splide__video')?.clientHeight / 2 - 6
            section.querySelectorAll('.splide__arrow').forEach(arrow => {
                arrow.style.top = `${top}px`
            })
        }

        const fixPagination = () => {
            if (window.matchMedia('(max-width: 575px').matches) {
                const pagination = section.querySelector('.splide__pagination')

                if (!pagination) return

                section.querySelector('.splide__pagination--mobile')?.remove()

                const total = pagination.querySelectorAll('button').length

                let text = element.dataset.textSlideOf.replace('[x]', mySplide.index + 1)
                text = text.replace('[total]', total)

                pagination.insertAdjacentHTML('beforebegin', `
                    <div class="splide__pagination--mobile text-muted small">
                        ${text}
                    </div>
                `)
            }
        }

        mySplide.on('ready resize', () => {
            fixArrowsPos()
            fixPagination()
        })

        mySplide.on('move', () => {
            fixPagination()
        })

        mySplide.mount(window.splide.Extensions)
    })
}
initVideoSlider()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.video-slider')) {
        initVideoSlider()
    }
})

// Animated Counters
const initAnimatedCounters = () => {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.animated-counter').forEach(counter => {
                    const speed = Number(counter.dataset.speed) * 1000

                    const animate = () => {
                        const value = +Number(counter.dataset.value)
                        const data = +Number(counter.querySelector('em').textContent)
                        const time = value / speed

                        if (data < value) {
                            counter.querySelector('em').textContent = Math.ceil(data + time)
                            setTimeout(animate, 10)
                        } else {
                            counter.querySelector('em').textContent = value
                        }
                    }
                    animate()
                })
            }
        })
    }, { threshold: 0.25 })

    document.querySelectorAll('.animated-counters').forEach((el) => {
        observer.observe(el)
    })
}
initAnimatedCounters()

// FAQ
document.addEventListener('shopify:block:select', (event) => {
    if (!event.target.closest('.faq')) return

    const collapse = event.target.querySelector('.accordion-collapse')

    if (collapse) {
        bootstrap.Collapse.getOrCreateInstance(collapse).show()
    }
})
