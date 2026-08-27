import { useRef, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const WelcomeLetter = () => {
  const { user } = useAuthStore();
  const letterRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return 'N/A';
    }
  };

  const downloadPDF = async () => {
    if (!letterRef.current) return;
    
    setIsGenerating(true);
    try {
      // Force explicit A4 dimensions for capture
      const element = letterRef.current;
      
      const canvas = await html2canvas(element, { 
        scale: 3, // High resolution (300 DPI feel)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123 // A4 height in pixels at 96 DPI
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate responsive height to fit A4 exactly
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Welcome_Letter_${user?.memberId || 'User'}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-[800px] w-full" />
      </div>
    );
  }

  const salutation = 'Dear';

  return (
    <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Letter</h1>
          <p className="text-muted-foreground text-sm">Your official joining confirmation document</p>
        </div>
        <Button 
          onClick={downloadPDF} 
          disabled={isGenerating} 
          className="gap-2"
          style={{ backgroundColor: '#dc2626' }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* A4 Letter Container - Scrollable Preview */}
      <div className="overflow-x-auto pb-4">
        <div 
          ref={letterRef}
          id="welcome-letter-content"
          className="relative mx-auto"
          style={{ 
            width: '210mm', 
            minHeight: '297mm',
            backgroundColor: '#ffffff',
            color: '#1a1a1a',
            fontFamily: 'Georgia, "Times New Roman", serif',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          {/* Watermark - Faint Logo in Center */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <img 
              src="https://res.cloudinary.com/dkgwi1xvx/image/upload/v1769630007/sdfsdf_q4ziyu.png" 
              alt=""
              style={{ 
                width: '300px',
                height: 'auto',
                opacity: 0.05
              }}
            />
          </div>

          {/* Header Geometric Shapes */}
          <div className="relative" style={{ height: '100px', overflow: 'hidden' }}>
            {/* Green Shape - Top Left (Primary) */}
            <div 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '65%',
                height: '100px',
                backgroundColor: '#16a34a',
                clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
              }}
            />
            {/* Red Shape - Top Right (Overlapping) */}
            <div 
              style={{ 
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100px',
                backgroundColor: '#dc2626',
                clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)',
              }}
            />
          </div>

          {/* Logo - Centered with White Background */}
          <div 
            className="flex justify-center"
            style={{ marginTop: '-50px', position: 'relative', zIndex: 10 }}
          >
            <div 
              style={{ 
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                padding: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
              }}
            >
              <img 
                src="https://res.cloudinary.com/dkgwi1xvx/image/upload/v1769630007/sdfsdf_q4ziyu.png" 
                alt="Sarva Solution Vision" 
                style={{ height: '70px', width: 'auto' }}
              />
            </div>
          </div>

          {/* Company Header - Sans Serif Bold */}
          <div style={{ textAlign: 'center', padding: '16px 32px 0', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#1a1a1a', 
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              SARVA SOLUTION VISION PVT LTD
            </h2>
            <p style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.6', marginBottom: '4px' }}>
              Head Office - Tarafdar Bhavan - 1st Floor, Atghora, Phool Tala, (Near - Chinar Park) Rajarhat Road, Kolkata - 700136
            </p>
            <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
              Corporate Office - P.C. Mitra Lane, Parapukur (Near - Tinkonia Bus Stand), Purba Bardhaman, Pin - 713101
            </p>
            <p style={{ fontSize: '11px', color: '#4b5563' }}>
              Phone: +91 98327 75700 | Web: www.sarvasolutionvision.com | E-mail: sarvasolution25@gmail.com
            </p>
          </div>

          {/* Divider */}
          <div style={{ margin: '20px 32px', borderTop: '2px solid #d1d5db' }} />

          {/* Main Content - Serif Font */}
          <div style={{ padding: '0 40px 120px', position: 'relative', zIndex: 5 }}>
            {/* Title */}
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              textAlign: 'center', 
              color: '#16a34a',
              marginBottom: '24px',
              letterSpacing: '2px'
            }}>
              CONGRATULATIONS!
            </h1>

            {/* Salutation */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '18px', color: '#1a1a1a' }}>
                {salutation} <span style={{ fontWeight: 'bold' }}>{user.fullName}</span>
              </p>
              <p style={{ fontSize: '16px', marginTop: '8px', color: '#374151' }}>
                WELCOME to the growing family of <span style={{ fontWeight: '600' }}>SARVA SOLUTION VISION PVT LTD</span>!
              </p>
            </div>

            {/* Body Paragraphs - Justified */}
            <div style={{ fontSize: '14px', color: '#374151', textAlign: 'justify', lineHeight: '1.8' }}>
              <p style={{ marginBottom: '16px' }}>
                We sincerely believe that your decision to join our company as an Individual Distributor will help and support the company in achieving its goals in a short time. You will also discover that being a part of this growing family provides you excellent opportunities to get everything you ever desired.
              </p>
              <p style={{ marginBottom: '16px' }}>
                Our primary goal is to provide high-quality health care and other products to our customers at affordable prices through our network of dedicated distributors like you. We are committed to your success and growth within our organization.
              </p>
              <p style={{ marginBottom: '16px' }}>
                As you begin this exciting journey with us, remember that success comes to those who work with dedication, integrity, and a spirit of teamwork. Our support system is designed to help you every step of the way—from training sessions to marketing materials, we've got you covered.
              </p>
              <p style={{ marginBottom: '16px', fontWeight: '500', color: '#1f2937', fontStyle: 'italic' }}>
                "If you grow, the company will grow"—this is the motto of our organization. We believe in mutual growth and prosperity for all our members.
              </p>
              <p style={{ marginBottom: '16px' }}>
                With best wishes: <span style={{ fontWeight: '600', color: '#16a34a' }}>"Fly high with us as a family member."</span>
              </p>
            </div>

            {/* Dynamic Details Section */}
            <div style={{ 
              marginTop: '32px', 
              padding: '16px 20px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                fontWeight: 'bold', 
                color: '#1a1a1a', 
                marginBottom: '12px', 
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}>
                Your Membership Details
              </h3>
              <div style={{ display: 'flex', gap: '24px', fontSize: '14px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Member ID:</span>
                  <p style={{ fontWeight: 'bold', color: '#16a34a', marginTop: '2px' }}>{user.memberId || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Sponsor ID:</span>
                  <p style={{ fontWeight: 'bold', color: '#1a1a1a', marginTop: '2px' }}>{user.sponsorId || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Date of Joining:</span>
                  <p style={{ fontWeight: 'bold', color: '#1a1a1a', marginTop: '2px' }}>{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Sign-off */}
            <div style={{ marginTop: '32px', textAlign: 'right', fontSize: '14px' }}>
              <p style={{ color: '#4b5563', marginBottom: '8px' }}>If you have any questions, please feel free to contact us.</p>
              <p style={{ color: '#374151' }}>Thanks and Regards,</p>
              <p style={{ fontWeight: 'bold', color: '#1a1a1a', marginTop: '4px' }}>Customer Service Department</p>
              <p style={{ color: '#16a34a', fontWeight: '600' }}>SARVA SOLUTION VISION PVT LTD Team</p>
            </div>
          </div>

          {/* Footer Geometric Shapes - Inverted Colors */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', overflow: 'hidden' }}>
            {/* Red Shape - Bottom Left */}
            <div 
              style={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '50%',
                height: '80px',
                backgroundColor: '#dc2626',
                clipPath: 'polygon(0 0, 85% 0, 100% 100%, 0 100%)',
              }}
            />
            {/* Green Shape - Bottom Right */}
            <div 
              style={{ 
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '65%',
                height: '80px',
                backgroundColor: '#16a34a',
                clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeLetter;
