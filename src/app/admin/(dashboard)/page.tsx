'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import { formatEGP } from '@/utils/currency';
import type { Product } from '@/types';
import styles from './admin.module.css';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';
import ProductModal from '@/components/ProductModal';

export default function AdminPage() {
  const { products, isLoaded, addProduct, updateProduct, deleteProduct } =
    useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const handleAdd = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  const handleSave = (productData: Product) => {
    if (productToEdit) {
      updateProduct(productData);
    } else {
      addProduct(productData);
    }
    setIsModalOpen(false);
  };

  const fmt = (price: number) => formatEGP(price);

  if (!isLoaded) return null;

  return (
    <>
      <header className={styles.adminHeader}>
        <h1>Products Management</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          <FaPlus style={{ marginRight: '8px' }} /> Add New Product
        </button>
      </header>

      {/* ── Products Table ── */}
      <div className={styles.adminContent}>
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Sale Price</th>
                <th>Badge</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className={styles.productImgCell}>
                    <Image
                      src={
                        product.images?.[0] || '/images/product-placeholder.png'
                      }
                      alt={product.name}
                      width={50}
                      height={50}
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                          <td>
                            <strong>{product.name}</strong>
                            <br />
                            <small style={{ color: '#64748b' }}>{product.notes}</small>
                          </td>
                          <td>{product.category}</td>
                  <td>{fmt(product.price)}</td>
                  <td>
                    {product.salePrice ? fmt(product.salePrice) : '-'}
                  </td>
                  <td>{product.badge || '-'}</td>
                  <td className={styles.actionBtns}>
                    <button
                      className={`${styles.btnIcon} ${styles.edit}`}
                      onClick={() => handleEdit(product)}
                      aria-label={`Edit ${product.name}`}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={`${styles.btnIcon} ${styles.delete}`}
                      onClick={() => handleDelete(product.id)}
                      aria-label={`Delete ${product.name}`}
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        productToEdit={productToEdit}
      />
    </>
  );
}
