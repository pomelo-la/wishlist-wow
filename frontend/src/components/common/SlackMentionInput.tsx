'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { slackService } from '@/services/slackService';
import { SlackUser } from '@/services/api';
import { Search, X, User } from 'lucide-react';

interface SlackMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SlackMentionInput({ 
  value, 
  onChange, 
  placeholder = "Mencionar a alguien...",
  className = ""
}: SlackMentionInputProps) {
  const [slackUsers, setSlackUsers] = useState<SlackUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SlackUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar usuarios de Slack al montar el componente
  useEffect(() => {
    loadSlackUsers();
  }, []);

  const loadSlackUsers = async () => {
    try {
      setLoading(true);
      const response = await slackService.getUsers();
      if (response.success && response.users) {
        setSlackUsers(response.users);
      } else {
        console.warn('Slack users not available:', response.error);
        // Crear usuarios de prueba si Slack no está configurado
        setSlackUsers([
          { id: '1', name: 'juan.perez', real_name: 'Juan Pérez', email: 'juan@example.com', is_bot: false },
          { id: '2', name: 'maria.garcia', real_name: 'María García', email: 'maria@example.com', is_bot: false },
          { id: '3', name: 'carlos.lopez', real_name: 'Carlos López', email: 'carlos@example.com', is_bot: false },
          { id: '4', name: 'ana.martinez', real_name: 'Ana Martínez', email: 'ana@example.com', is_bot: false },
          { id: '5', name: 'pedro.rodriguez', real_name: 'Pedro Rodríguez', email: 'pedro@example.com', is_bot: false }
        ]);
      }
    } catch (error) {
      console.error('Error loading Slack users:', error);
      // Crear usuarios de prueba si hay error
      setSlackUsers([
        { id: '1', name: 'juan.perez', real_name: 'Juan Pérez', email: 'juan@example.com', is_bot: false },
        { id: '2', name: 'maria.garcia', real_name: 'María García', email: 'maria@example.com', is_bot: false },
        { id: '3', name: 'carlos.lopez', real_name: 'Carlos López', email: 'carlos@example.com', is_bot: false },
        { id: '4', name: 'ana.martinez', real_name: 'Ana Martínez', email: 'ana@example.com', is_bot: false },
        { id: '5', name: 'pedro.rodriguez', real_name: 'Pedro Rodríguez', email: 'pedro@example.com', is_bot: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios basado en el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = slackUsers.filter(user => 
        user.real_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered.slice(0, 10)); // Limitar a 10 resultados
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, slackUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Buscar si hay un @ antes del cursor
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Verificar que no hay espacios entre @ y el cursor
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStart(lastAtIndex);
        setSearchTerm(textAfterAt);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    } else {
      // Si no hay @, buscar automáticamente después de 2 caracteres
      if (newValue.trim().length >= 2) {
        setMentionStart(-1); // No hay @, es búsqueda libre
        setSearchTerm(newValue.trim());
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    }
    
    onChange(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Lógica para navegar hacia abajo en el dropdown
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Lógica para navegar hacia arriba en el dropdown
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredUsers.length > 0) {
          selectUser(filteredUsers[0]);
        }
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    }
  };

  const selectUser = (user: SlackUser) => {
    if (mentionStart !== -1) {
      // Caso con @: reemplazar el texto después del @
      const beforeMention = value.substring(0, mentionStart);
      const afterMention = value.substring(mentionStart + 1 + searchTerm.length);
      const mention = `@${user.real_name}`;
      
      const newValue = beforeMention + mention + afterMention;
      onChange(newValue);
      
      setShowDropdown(false);
      setMentionStart(-1);
      setSearchTerm('');
      
      // Enfocar el input después de la selección
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPosition = beforeMention.length + mention.length;
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          inputRef.current.focus();
        }
      }, 0);
    } else {
      // Caso sin @: reemplazar todo el texto con la mención
      const mention = `@${user.real_name}`;
      onChange(mention);
      
      setShowDropdown(false);
      setMentionStart(-1);
      setSearchTerm('');
      
      // Enfocar el input después de la selección
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(mention.length, mention.length);
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={showDropdown ? "Escribir nombre para buscar usuarios de Slack..." : placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black ${showDropdown ? 'border-blue-500' : ''} ${className}`}
        rows={3}
      />
      {showDropdown && (
        <div className="absolute top-2 right-2 text-blue-500 text-xs">
          @
        </div>
      )}
      
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Cargando usuarios...
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                Mencionar a alguien:
              </div>
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                >
                  <User size={16} className="text-gray-400" />
                  <div>
                    <div className="font-medium text-sm text-gray-900">{user.real_name}</div>
                    <div className="text-xs text-gray-500">@{user.name}</div>
                  </div>
                </button>
              ))}
            </>
          ) : searchTerm ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No se encontraron usuarios para "{searchTerm}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
