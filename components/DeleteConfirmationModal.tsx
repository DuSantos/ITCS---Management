import React from 'react';
import { Asset } from '../types';
import { AlertCircle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  asset: Asset | null;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, asset }) => {
  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            Confirmar Eliminação
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600">
            Tem a certeza que deseja eliminar permanentemente o registo de aluguer de:
          </p>
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md">
            <p className="font-bold text-gray-900">{asset.consultantName}</p>
            <p className="text-xs text-gray-500 mt-1">{asset.equipmentSpecs}</p>
            <p className="text-xs text-gray-400">S/N: {asset.serialNumber}</p>
          </div>
          <p className="mt-4 text-sm text-gray-500 italic">
            Esta ação não pode ser revertida.
          </p>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium shadow-sm transition-colors"
          >
            Sim, Eliminar Registo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;