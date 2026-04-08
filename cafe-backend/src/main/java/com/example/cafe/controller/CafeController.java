package com.example.cafe.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.cafe.dto.AddressDto;
import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.CafeDocumentDto;
import com.example.cafe.dto.CafeImageDto;
import com.example.cafe.dto.CafeRegistrationRequest;
import com.example.cafe.dto.CafeUpdateRequest;
import com.example.cafe.entity.Address;
import com.example.cafe.entity.Booking;
import com.example.cafe.entity.Cafe;
import com.example.cafe.entity.Cafe.CafeStatus;
import com.example.cafe.entity.CafeDocument;
import com.example.cafe.entity.CafeImage;
import com.example.cafe.entity.TableType;
import com.example.cafe.entity.User;
import com.example.cafe.repository.BookingRepository;
import com.example.cafe.repository.CafeRepository;
import com.example.cafe.repository.TableTypeRepository;
import com.example.cafe.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/cafe")
@CrossOrigin(origins = "http://localhost:3000")
public class CafeController {

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TableTypeRepository tableTypeRepository;
    
    @Autowired
    private BookingRepository bookingRepository;

    /**
     * GET /api/cafe/status - Check if owner has a cafe registered
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCafeStatus(@RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            
            Optional<Cafe> cafeOpt = cafeRepository.findByOwnerId(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("hasCafe", cafeOpt.isPresent());
            
            if (cafeOpt.isPresent()) {
                Cafe cafe = cafeOpt.get();
                response.put("cafeId", cafe.getId());
                response.put("cafeName", cafe.getCafeName());
                response.put("status", cafe.getStatus().toString().toLowerCase());
            }

            return ResponseEntity.ok()
                .body(ApiResponse.success("Cafe status retrieved", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to check cafe status: " + e.getMessage()));
        }
    }

    /**
     * GET /api/cafe/my-cafe - Get full cafe details for current owner
     */
    @GetMapping("/my-cafe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyCafe(@RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            
            Optional<Cafe> cafeOpt = cafeRepository.findByOwnerId(userId);
            
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No cafe found for this owner"));
            }

            Cafe cafe = cafeOpt.get();
            Map<String, Object> cafeData = buildCafeData(cafe);

            return ResponseEntity.ok()
                .body(ApiResponse.success("Cafe details retrieved", cafeData));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve cafe details: " + e.getMessage()));
        }
    }

    /**
     * GET /api/cafe/owner/{ownerId} - Get cafe by owner ID
     */
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCafeByOwner(@PathVariable Long ownerId) {
        try {
            Optional<Cafe> cafeOpt = cafeRepository.findByOwnerId(ownerId);
            
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No cafe found for this owner"));
            }

            Cafe cafe = cafeOpt.get();
            Map<String, Object> cafeData = buildCafeData(cafe);

            return ResponseEntity.ok()
                .body(ApiResponse.success("Cafe details retrieved", cafeData));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve cafe details: " + e.getMessage()));
        }
    }

    /**
     * GET /api/cafe/{cafeId} - Get cafe by ID
     */
    @GetMapping("/{cafeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCafeById(@PathVariable Long cafeId) {
        try {
            Optional<Cafe> cafeOpt = cafeRepository.findById(cafeId);
            
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Cafe not found"));
            }

            Cafe cafe = cafeOpt.get();
            Map<String, Object> cafeData = buildCafeData(cafe);

            return ResponseEntity.ok()
                .body(ApiResponse.success("Cafe details retrieved", cafeData));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve cafe details: " + e.getMessage()));
        }
    }

    /**
     * POST /api/cafe/register - Register a new cafe
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> registerCafe(
            @RequestParam(required = false) Long ownerId,
            @RequestBody CafeRegistrationRequest request) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            
            if (cafeRepository.existsByOwnerId(userId)) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("You already have a registered cafe"));
            }

            User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Cafe cafe = new Cafe();
            cafe.setOwner(owner);
            cafe.setCafeName(request.getCafeName());
            cafe.setDescription(request.getDescription());
            cafe.setEmail(request.getEmail());
            cafe.setPhone(request.getPhone());
            cafe.setEstablishedYear(request.getEstablishedYear());
            cafe.setTotalTables(request.getTotalTables());
            cafe.setSeatingCapacity(request.getSeatingCapacity());
            cafe.setHasWifi(request.getHasWifi() != null ? request.getHasWifi() : false);
            cafe.setHasParking(request.getHasParking() != null ? request.getHasParking() : false);
            cafe.setHasAC(request.getHasAC() != null ? request.getHasAC() : false);
            cafe.setStatus(CafeStatus.APPROVED);

            if (request.getAddress() != null) {
                AddressDto addrDto = request.getAddress();
                Address address = new Address();
                address.setStreet(addrDto.getStreet());
                address.setPlotNo(addrDto.getPlotNo());
                address.setCity(addrDto.getCity());
                address.setPincode(addrDto.getPincode());
                address.setCountry(addrDto.getCountry() != null ? addrDto.getCountry() : "India");
                address.setIsPrimary(true);
                cafe.setAddress(address);
            }

            Cafe savedCafe = cafeRepository.save(cafe);

            if (request.getTableTypes() != null && !request.getTableTypes().isEmpty()) {
                for (com.example.cafe.dto.TableTypeDto dto : request.getTableTypes()) {
                    if (dto.getTypeName() == null || dto.getTypeName().trim().isEmpty()) continue;
                    TableType type = new TableType();
                    type.setCafe(savedCafe);
                    type.setTypeName(dto.getTypeName().trim());
                    type.setDescription(dto.getDescription());

                    int tableCount = dto.getTableCount() != null ? dto.getTableCount() : 0;
                    type.setTableCount(tableCount);
                    // initialize available tables equal to configured count
                    type.setAvailableTables(tableCount);

                    type.setSeatingCapacityPerTable(
                        dto.getSeatingCapacityPerTable() != null ? dto.getSeatingCapacityPerTable() : 4
                    );
                    type.setMinimumOrderAmount(
                        dto.getMinimumOrderAmount() != null ? dto.getMinimumOrderAmount() : 0.0
                    );
                    type.setPricePerHour(
                        dto.getPricePerHour() != null ? dto.getPricePerHour() : 0.0
                    );
                    type.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
                    tableTypeRepository.save(type);
                }
            }

            if (request.getDocuments() != null && !request.getDocuments().isEmpty()) {
                for (CafeDocumentDto docDto : request.getDocuments()) {
                    if (docDto.getDocumentType() == null || docDto.getFileData() == null) continue;
                    
                    CafeDocument doc = new CafeDocument();
                    doc.setCafe(savedCafe);
                    doc.setDocumentType(docDto.getDocumentType());
                    doc.setFileName(docDto.getFileName() != null ? docDto.getFileName() : "document");
                    doc.setFileSize(docDto.getFileSize() != null ? docDto.getFileSize() : 0L);
                    doc.setFileType(docDto.getFileType());
                    doc.setFileData(docDto.getFileData());
                    savedCafe.addDocument(doc);
                }
                savedCafe = cafeRepository.save(savedCafe);
            }

            if (request.getImages() != null && !request.getImages().isEmpty()) {
                for (CafeImageDto imgDto : request.getImages()) {
                    if (imgDto.getFileData() == null) continue;
                    
                    CafeImage img = new CafeImage();
                    img.setCafe(savedCafe);
                    img.setCaption(imgDto.getCaption());
                    img.setIsPrimary(imgDto.getIsPrimary() != null ? imgDto.getIsPrimary() : false);
                    img.setFileName(imgDto.getFileName() != null ? imgDto.getFileName() : "image");
                    img.setFileSize(imgDto.getFileSize() != null ? imgDto.getFileSize() : 0L);
                    img.setFileType(imgDto.getFileType());
                    img.setFileData(imgDto.getFileData());
                    savedCafe.addImage(img);
                }
                savedCafe = cafeRepository.save(savedCafe);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("cafeId", savedCafe.getId());
            response.put("cafeName", savedCafe.getCafeName());
            response.put("status", savedCafe.getStatus().toString().toLowerCase());
            response.put("message", "Cafe registered successfully.");

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cafe registered successfully", response));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to register cafe: " + e.getMessage()));
        }
    }

    /**
     * GET /api/cafe/public/approved - List approved cafes
     */
    @GetMapping("/public/approved")
    public ResponseEntity<ApiResponse<java.util.List<Map<String, Object>>>> listApprovedCafes() {
        try {
            java.util.List<Cafe> cafes = cafeRepository.findByStatus(CafeStatus.APPROVED);
            java.util.List<Map<String, Object>> result = new ArrayList<>();
            for (Cafe cafe : cafes) {
                Map<String, Object> c = new HashMap<>();
                c.put("id", cafe.getId());
                c.put("cafeName", cafe.getCafeName());
                c.put("description", cafe.getDescription());
                c.put("city", cafe.getAddress() != null ? cafe.getAddress().getCity() : null);
                c.put("totalTables", cafe.getTotalTables());
                c.put("seatingCapacity", cafe.getSeatingCapacity());
                c.put("hasWifi", cafe.getHasWifi());
                c.put("hasParking", cafe.getHasParking());
                c.put("hasAC", cafe.getHasAC());

                String primaryImage = null;
                String primaryImageType = null;
                if (cafe.getImages() != null) {
                    for (CafeImage img : cafe.getImages()) {
                        if (img.getIsPrimary() != null && img.getIsPrimary()) {
                            primaryImage = img.getFileData();
                            primaryImageType = img.getFileType();
                            break;
                        }
                    }
                    if (primaryImage == null && !cafe.getImages().isEmpty()) {
                        CafeImage img = cafe.getImages().get(0);
                        primaryImage = img.getFileData();
                        primaryImageType = img.getFileType();
                    }
                }
                c.put("primaryImageData", primaryImage);
                c.put("primaryImageType", primaryImageType);
                result.add(c);
            }

            return ResponseEntity.ok(ApiResponse.success("Approved cafes retrieved", result));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to list cafes: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/cafe/{cafeId}/update-with-images - Update cafe with multiple images
     */
    @PutMapping(value = "/{cafeId}/update-with-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateCafeWithImages(
            @PathVariable Long cafeId,
            @RequestPart("cafe") String cafeJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(required = false) Map<String, String> allParams) {
        
        try {
            // Parse cafe JSON
            ObjectMapper mapper = new ObjectMapper();
            CafeUpdateRequest updateRequest = mapper.readValue(cafeJson, CafeUpdateRequest.class);

            // Find existing cafe
            Cafe cafe = cafeRepository.findById(cafeId)
                    .orElseThrow(() -> new RuntimeException("Cafe not found"));

            // Update basic info
            if (updateRequest.getCafeName() != null && !updateRequest.getCafeName().trim().isEmpty()) 
                cafe.setCafeName(updateRequest.getCafeName().trim());
            
            if (updateRequest.getDescription() != null) 
                cafe.setDescription(updateRequest.getDescription());
            
            if (updateRequest.getEmail() != null && !updateRequest.getEmail().trim().isEmpty()) 
                cafe.setEmail(updateRequest.getEmail().trim());
            
            if (updateRequest.getPhone() != null) 
                cafe.setPhone(updateRequest.getPhone());
            
            if (updateRequest.getEstablishedYear() != null) 
                cafe.setEstablishedYear(updateRequest.getEstablishedYear());
            
            if (updateRequest.getTotalTables() != null) 
                cafe.setTotalTables(updateRequest.getTotalTables());
            
            if (updateRequest.getSeatingCapacity() != null) 
                cafe.setSeatingCapacity(updateRequest.getSeatingCapacity());
            
            if (updateRequest.getHasWifi() != null) 
                cafe.setHasWifi(updateRequest.getHasWifi());
            
            if (updateRequest.getHasParking() != null) 
                cafe.setHasParking(updateRequest.getHasParking());
            
            if (updateRequest.getHasAC() != null) 
                cafe.setHasAC(updateRequest.getHasAC());

            // Update address
            if (updateRequest.getAddress() != null) {
                cafe.setAddress(updateRequest.getAddress());
            }

            // Handle images - if new images are provided, replace existing ones
            if (images != null && !images.isEmpty()) {
                // Clear existing images
                cafe.getImages().clear();
                
                for (int i = 0; i < images.size(); i++) {
                    MultipartFile file = images.get(i);
                    if (!file.isEmpty() && file.getSize() > 0) {
                        CafeImage cafeImage = new CafeImage();
                        cafeImage.setFileName(file.getOriginalFilename() != null ? 
                            file.getOriginalFilename() : "image_" + i + ".jpg");
                        cafeImage.setFileSize(file.getSize());
                        cafeImage.setFileType(file.getContentType());
                        
                        // Convert to base64 for storage
                        byte[] bytes = file.getBytes();
                        String base64 = java.util.Base64.getEncoder().encodeToString(bytes);
                        cafeImage.setFileData(base64);
                        
                        // Check if this image is primary (first image is primary by default if not specified)
                        boolean isPrimary = false;
                        if (allParams != null) {
                            String isPrimaryParam = allParams.get("image_" + i + "_isPrimary");
                            isPrimary = isPrimaryParam != null && Boolean.parseBoolean(isPrimaryParam);
                        }
                        // If no primary specified, make the first image primary
                        if (i == 0 && !isPrimary && images.size() > 0) {
                            isPrimary = true;
                        }
                        cafeImage.setIsPrimary(isPrimary);
                        
                        String captionParam = allParams != null ? allParams.get("image_" + i + "_caption") : null;
                        cafeImage.setCaption(captionParam != null ? captionParam : "");
                        
                        cafeImage.setCafe(cafe);
                        cafe.getImages().add(cafeImage);
                    }
                }
            }

            // Save updated cafe
            Cafe savedCafe = cafeRepository.save(cafe);

            Map<String, Object> response = new HashMap<>();
            response.put("cafeId", savedCafe.getId());
            response.put("cafeName", savedCafe.getCafeName());
            response.put("message", "Cafe updated successfully with " + 
                (images != null ? images.size() : 0) + " images");

            return ResponseEntity.ok()
                    .body(ApiResponse.success("Cafe updated successfully", response));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update cafe: " + e.getMessage()));
        }
    }

    /**
     * Helper method to build cafe data map
     */
    private Map<String, Object> buildCafeData(Cafe cafe) {
        Map<String, Object> data = new HashMap<>();
        data.put("hasCafe", true);
        data.put("id", cafe.getId());
        data.put("cafeName", cafe.getCafeName());
        data.put("description", cafe.getDescription());
        data.put("email", cafe.getEmail());
        data.put("phone", cafe.getPhone());
        data.put("establishedYear", cafe.getEstablishedYear());
        data.put("totalTables", cafe.getTotalTables());
        data.put("seatingCapacity", cafe.getSeatingCapacity());
        data.put("totalRevenue", cafe.getTotalRevenue());
        data.put("hasWifi", cafe.getHasWifi());
        data.put("hasParking", cafe.getHasParking());
        data.put("hasAC", cafe.getHasAC());
        data.put("status", cafe.getStatus() != null ? cafe.getStatus().toString().toLowerCase() : "unknown");
        data.put("createdAt", cafe.getCreatedAt());
        data.put("updatedAt", cafe.getUpdatedAt());

        if (cafe.getOwner() != null) {
            Map<String, Object> owner = new HashMap<>();
            owner.put("id", cafe.getOwner().getId());
            owner.put("name", cafe.getOwner().getName());
            owner.put("email", cafe.getOwner().getEmail());
            data.put("owner", owner);
        }

        if (cafe.getAddress() != null) {
            Map<String, Object> address = new HashMap<>();
            address.put("street", cafe.getAddress().getStreet());
            address.put("plotNo", cafe.getAddress().getPlotNo());
            address.put("city", cafe.getAddress().getCity());
            address.put("pincode", cafe.getAddress().getPincode());
            address.put("country", cafe.getAddress().getCountry());
            address.put("isPrimary", cafe.getAddress().getIsPrimary());
            data.put("address", address);
        }

        if (cafe.getDocuments() != null && !cafe.getDocuments().isEmpty()) {
            List<Map<String, Object>> documents = new ArrayList<>();
            for (CafeDocument doc : cafe.getDocuments()) {
                Map<String, Object> docMap = new HashMap<>();
                docMap.put("id", doc.getId());
                docMap.put("documentType", doc.getDocumentType());
                docMap.put("fileName", doc.getFileName());
                docMap.put("fileSize", doc.getFileSize());
                docMap.put("fileType", doc.getFileType());
                docMap.put("fileData", doc.getFileData());
                docMap.put("createdAt", doc.getCreatedAt());
                documents.add(docMap);
            }
            data.put("documents", documents);
        }

        if (cafe.getImages() != null && !cafe.getImages().isEmpty()) {
            List<Map<String, Object>> images = new ArrayList<>();
            for (CafeImage img : cafe.getImages()) {
                Map<String, Object> imgMap = new HashMap<>();
                imgMap.put("id", img.getId());
                imgMap.put("caption", img.getCaption());
                imgMap.put("isPrimary", img.getIsPrimary());
                imgMap.put("fileName", img.getFileName());
                imgMap.put("fileSize", img.getFileSize());
                imgMap.put("fileType", img.getFileType());
                imgMap.put("fileData", img.getFileData());
                imgMap.put("createdAt", img.getCreatedAt());
                images.add(imgMap);
            }
            data.put("images", images);
        }

        if (cafe.getTableTypes() != null && !cafe.getTableTypes().isEmpty()) {
            List<Map<String, Object>> tableTypes = new ArrayList<>();
            for (TableType type : cafe.getTableTypes()) {
                Map<String, Object> t = new HashMap<>();
                t.put("id", type.getId());
                t.put("typeName", type.getTypeName());
                t.put("description", type.getDescription());
                t.put("tableCount", type.getTableCount());
                t.put("seatingCapacityPerTable", type.getSeatingCapacityPerTable());
                t.put("minimumOrderAmount", type.getMinimumOrderAmount());
                t.put("isActive", type.getIsActive());
                tableTypes.add(t);
            }
            data.put("tableTypes", tableTypes);
        }

        return data;
    }

    /**
 * POST /api/cafe/{cafeId}/revenue - Add revenue to cafe
 */
@PostMapping("/{cafeId}/revenue")
public ResponseEntity<ApiResponse<Map<String, Object>>> addRevenue(
        @PathVariable Long cafeId,
        @RequestBody Map<String, Object> revenueData) {
    try {
        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new RuntimeException("Cafe not found"));
        
        Double amount = ((Number) revenueData.get("amount")).doubleValue();
        cafe.addRevenue(amount);
        cafeRepository.save(cafe);
        
        Map<String, Object> response = new HashMap<>();
        response.put("cafeId", cafe.getId());
        response.put("totalRevenue", cafe.getTotalRevenue());
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Revenue added successfully", response));
        
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to add revenue: " + e.getMessage()));
    }
}

/**
 * GET /api/cafe/{cafeId}/revenue/stats - Get revenue statistics
 */
@GetMapping("/{cafeId}/revenue/stats")
public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueStats(@PathVariable Long cafeId) {
    try {
        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new RuntimeException("Cafe not found"));
        
        List<Booking> completedBookings = bookingRepository.findByCafeIdAndStatus(
                cafeId, Booking.BookingStatus.COMPLETED);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", cafe.getTotalRevenue());
        stats.put("completedBookings", completedBookings.size());
        
        // Revenue by table type
        Map<String, Double> revenueByTableType = new HashMap<>();
        for (Booking booking : completedBookings) {
            if (booking.getTableType() != null) {
                String typeName = booking.getTableType().getTypeName();
                double price = booking.getTableType().getPricePerHour();
                double hours = (booking.getEndTime() != null && booking.getStartTime() != null) 
                    ? (booking.getEndTime().toEpochSecond(java.time.ZoneOffset.UTC) - 
                       booking.getStartTime().toEpochSecond(java.time.ZoneOffset.UTC)) / 3600.0
                    : 0;
                double revenue = price * hours;
                revenueByTableType.put(typeName, 
                    revenueByTableType.getOrDefault(typeName, 0.0) + revenue);
            }
        }
        stats.put("revenueByTableType", revenueByTableType);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Revenue stats retrieved", stats));
        
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to get revenue stats: " + e.getMessage()));
    }
}
}
