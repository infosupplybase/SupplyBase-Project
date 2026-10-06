import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useCart } from '../context/CartContext';
import { formatRupees, formatItemPrice } from '../lib/money';

export default function Cart() {
    const plumbing = useCart('plumbing');
    const electrical = useCart('electrical');

    const totalCount = plumbing.count + electrical.count;

    const totalPaise =
        plumbing.subtotalPaise + electrical.subtotalPaise;

    if (totalCount === 0) {
        return (
            <section className="plb-section global-cart-page">
                <div className="container container-narrow plb-cart-empty">
                    <Icon name="shopping-bag" size={40} />

                    <h1>Your cart is empty</h1>

                    <p>Add a service to get started.</p>

                    <Link
                        to="/services"
                        className="btn btn-primary"
                    >
                        Browse Services
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="plb-section global-cart-page">
            <div className="container container-narrow">

                <div className="plb-cart-head">
                    <Link
                        to="/services"
                        className="plb-back-link"
                    >
                        <Icon name="arrow-left" size={18} />
                        Continue browsing
                    </Link>

                    <h1>
                        Your Cart{' '}
                        <span>
                            ({totalCount} item{totalCount > 1 ? 's' : ''})
                        </span>
                    </h1>
                </div>

                {/* Plumbing */}
                {plumbing.count > 0 && (
                    <CartGroup
                        title="Plumbing"
                        cart={plumbing}
                    />
                )}

                {/* Electrical */}
                {electrical.count > 0 && (
                    <CartGroup
                        title="Electrical"
                        cart={electrical}
                    />
                )}

                {/* =========================
                    COMBINED TOTAL
                ========================= */}

                <div className="plb-cart-summary">

                    <div className="plb-cart-summary-row">
                        <span>
                            Total ({totalCount} item
                            {totalCount > 1 ? 's' : ''})
                        </span>

                        <strong>
                            {formatRupees(totalPaise / 100)}
                        </strong>
                    </div>

                    {/* ONE CHECKOUT BUTTON ONLY */}

                    <Link
                        to="/checkout"
                        className="btn btn-primary !w-[80%] !mx-auto !flex !justify-center md:!w-[280px]"
                    >
                        Checkout
                        <Icon
                            name="arrow-right"
                            size={17}
                        />
                    </Link>

                </div>

            </div>
        </section>
    );
}


/* =====================================================
   CART GROUP
===================================================== */

function CartGroup({ title, cart }) {

    const {
        items,
        count,
        subtotalPaise,
        updateQuantity,
        removeItem,
    } = cart;

    return (
        <div
            className="plb-cart-summary"
            style={{ marginBottom: 24 }}
        >

            {/* CATEGORY HEADER */}

            <div className="plb-cart-summary-row">

                <strong>
                    {title}
                </strong>

                <span>
                    {count} item
                    {count > 1 ? 's' : ''}
                </span>

            </div>


            {/* ITEMS */}

            <div className="plb-list">

                {items.map((item) => (

                    <div
                        className="plb-row plb-cart-row"
                        key={item.itemSlug}
                    >

                        <div className="plb-row-body">

                            <span className="plb-row-name">
                                {item.name}
                            </span>

                            {item.description && (
                                <p className="plb-row-desc">
                                    {item.description}
                                </p>
                            )}

                            <div className="plb-row-price">

                                {formatItemPrice(
                                    item.unitPricePaise / 100
                                )}

                                <span>
                                    {' × '}
                                    {item.quantity}
                                </span>

                            </div>

                        </div>


                        {/* ACTIONS */}

                        <div className="plb-cart-row-actions">

                            {/* QUANTITY */}

                            <div
                                className="plb-qty"
                                role="group"
                                aria-label={`${item.name} quantity`}
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        updateQuantity(
                                            item.itemSlug,
                                            item.quantity - 1
                                        )
                                    }
                                    aria-label={`Decrease ${item.name} quantity`}
                                >
                                    −
                                </button>

                                <span>
                                    {item.quantity}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        updateQuantity(
                                            item.itemSlug,
                                            item.quantity + 1
                                        )
                                    }
                                    aria-label={`Increase ${item.name} quantity`}
                                >
                                    +
                                </button>

                            </div>


                            {/* ITEM TOTAL */}

                            <span className="plb-cart-row-total">

                                {formatItemPrice(
                                    (
                                        item.unitPricePaise *
                                        item.quantity
                                    ) / 100
                                )}

                            </span>


                            {/* REMOVE */}

                            <button
                                type="button"
                                className="plb-cart-row-remove"
                                onClick={() =>
                                    removeItem(item.itemSlug)
                                }
                                aria-label={`Remove ${item.name}`}
                            >
                                <Icon
                                    name="close"
                                    size={16}
                                />
                            </button>

                        </div>

                    </div>

                ))}

            </div>


            {/* CATEGORY SUBTOTAL */}

            <div className="plb-cart-summary-row">

                <span>
                    Subtotal
                </span>

                <strong>
                    {formatRupees(
                        subtotalPaise / 100
                    )}
                </strong>

            </div>

        </div>
    );
}