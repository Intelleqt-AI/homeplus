const DashboardPreview = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-6 mb-4">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Your home managed
          </h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Home+ is the UK's first intelligent home management system that combines 
            maintenance scheduling, instant trade matching, and document storage. 
            Designed for UK homes, pre-loaded with legal requirements like Gas Safety 
            Certificates, EICR testing, and EPC ratings.
          </p>
          
          {/* Bullet Points */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-foreground font-medium">Save £847 yearly by preventing emergencies</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-foreground font-medium">Add £5,000+ to your property value</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;