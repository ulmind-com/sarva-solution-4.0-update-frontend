import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const WhatsAppWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const logoUrl = 'https://res.cloudinary.com/dkgwi1xvx/image/upload/v1769630007/sdfsdf_q4ziyu.png';
  const phoneNumber = '919832775700';
  const displayNumber = '+91 98327 75700';

  const handleSendMessage = () => {
    if (message.trim()) {
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
      setMessage('');
    }
  };

  const handleRaiseRequest = () => {
    toast({
      title: "Callback Requested!",
      description: "Our team will call you back shortly.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col gap-3 w-[340px] max-w-[calc(100vw-3rem)]"
          >
            {/* Raise Request Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1E40AF] rounded-xl p-4 shadow-2xl"
            >
              <p className="text-white text-sm mb-3">
                Want our team to call you back?
              </p>
              <Button
                onClick={handleRaiseRequest}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium"
              >
                <Phone className="w-4 h-4 mr-2" />
                Raise a Request
              </Button>
            </motion.div>

            {/* Main Chat Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#075E54] p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={logoUrl} 
                    alt="Sarva Support" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm">Sarva Support Team</h4>
                  <p className="text-white/80 text-xs">{displayNumber}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Body */}
              <div 
                className="p-4 min-h-[140px]"
                style={{
                  backgroundColor: '#ECE5DD',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {/* Message Bubble */}
                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%] relative">
                  <p className="text-gray-800 text-sm leading-relaxed">
                    Hi there 👋
                    <br />
                    How can I help you?
                  </p>
                  <span className="text-[10px] text-gray-500 mt-1 block text-right">
                    Just now
                  </span>
                  {/* Bubble tail */}
                  <div 
                    className="absolute -left-2 top-0 w-0 h-0"
                    style={{
                      borderTop: '8px solid white',
                      borderLeft: '8px solid transparent',
                    }}
                  />
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 bg-[#F0F0F0] flex items-center gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter Your Message..."
                  className="flex-1 bg-white border-0 rounded-full text-sm h-10 px-4"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-10 h-10 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center transition-colors shadow-md"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center shadow-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={!isOpen ? {
          boxShadow: [
            '0 0 0 0 rgba(37, 211, 102, 0.4)',
            '0 0 0 15px rgba(37, 211, 102, 0)',
          ],
        } : {}}
        transition={!isOpen ? {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        } : {}}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <svg 
            viewBox="0 0 24 24" 
            className="w-7 h-7 text-white fill-current"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l4.93-1.36C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm.03 17.5c-1.63 0-3.15-.45-4.45-1.22l-.32-.18-2.93.81.81-2.93-.2-.32A7.44 7.44 0 014.5 12c0-4.14 3.36-7.5 7.5-7.5S19.5 7.86 19.5 12s-3.36 7.5-7.47 7.5zm4.14-5.63c-.22-.11-1.32-.65-1.52-.73-.2-.07-.35-.11-.5.11-.15.22-.58.73-.71.88-.13.15-.26.17-.49.06-.22-.11-.94-.35-1.79-1.11-.66-.59-1.11-1.32-1.24-1.54-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.21-.69-1.66-.18-.43-.37-.37-.5-.38-.13-.01-.28-.01-.43-.01-.15 0-.39.06-.6.28-.2.22-.78.76-.78 1.86s.8 2.16.91 2.31c.11.15 1.57 2.4 3.81 3.36.53.23.95.37 1.27.47.54.17 1.02.15 1.41.09.43-.06 1.32-.54 1.51-1.06.19-.52.19-.97.13-1.06-.06-.09-.21-.15-.43-.26z"/>
          </svg>
        )}
      </motion.button>
    </div>
  );
};

export default WhatsAppWidget;
