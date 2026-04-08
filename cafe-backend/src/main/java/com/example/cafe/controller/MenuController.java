package com.example.cafe.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.MenuItemDto;
import com.example.cafe.dto.MenuItemImageDto;
import com.example.cafe.entity.ActivityLog;
import com.example.cafe.entity.Cafe;
import com.example.cafe.entity.MenuItem;
import com.example.cafe.entity.MenuItemImage;
import com.example.cafe.repository.ActivityLogRepository;
import com.example.cafe.repository.CafeRepository;
import com.example.cafe.repository.MenuItemRepository;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin(origins = "http://localhost:3000")
public class MenuController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    /**
     * GET /api/menu/my
     * List menu items for the currently logged-in cafe owner.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<MenuItemDto>>> getMyMenu(@RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;

            Optional<Cafe> cafeOpt = cafeRepository.findByOwnerId(userId);
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("No cafe found for this owner. Please register your cafe first."));
            }

            Cafe cafe = cafeOpt.get();
            List<MenuItem> items = menuItemRepository.findByCafeId(cafe.getId());

            List<MenuItemDto> dtoList = items.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Menu items retrieved", dtoList));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load menu items: " + e.getMessage()));
        }
    }

    /**
     * POST /api/menu/my - Add a new menu item with multiple images
     */
    @PostMapping("/my")
    public ResponseEntity<ApiResponse<MenuItemDto>> addMenuItem(
            @RequestParam(required = false) Long ownerId,
            @RequestBody MenuItemDto request) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;

            Optional<Cafe> cafeOpt = cafeRepository.findByOwnerId(userId);
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("No cafe found for this owner. Please register your cafe first."));
            }

            Cafe cafe = cafeOpt.get();

            if (request.getName() == null || request.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Item name is required"));
            }
            if (request.getPrice() == null || request.getPrice() <= 0) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Price must be greater than 0"));
            }

            MenuItem item = new MenuItem();
            item.setCafe(cafe);
            item.setName(request.getName().trim());
            item.setDescription(request.getDescription());
            item.setPrice(request.getPrice());
            item.setCategory(request.getCategory());
            item.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true);

            MenuItem saved = menuItemRepository.save(item);

            // Handle multiple images
            if (request.getImages() != null && !request.getImages().isEmpty()) {
                for (MenuItemImageDto imgDto : request.getImages()) {
                    if (imgDto.getFileData() == null || imgDto.getFileData().isEmpty()) continue;
                    
                    MenuItemImage img = new MenuItemImage();
                    img.setMenuItem(saved);
                    img.setCaption(imgDto.getCaption());
                    img.setIsPrimary(imgDto.getIsPrimary() != null ? imgDto.getIsPrimary() : false);
                    img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : 0);
                    img.setFileName(imgDto.getFileName() != null ? imgDto.getFileName() : "image");
                    img.setFileSize(imgDto.getFileSize() != null ? imgDto.getFileSize() : 0L);
                    img.setFileType(imgDto.getFileType());
                    img.setFileData(imgDto.getFileData());
                    saved.addImage(img);
                }
                saved = menuItemRepository.save(saved);
            }

            MenuItemDto dto = toDto(saved);

            try {
                ActivityLog log = new ActivityLog();
                log.setCafe(cafe);
                log.setType("MENU_ADDED");
                log.setMessage("Menu item added: " + saved.getName() + " with " + saved.getImages().size() + " images");
                activityLogRepository.save(log);
            } catch (Exception ignored) {}

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Menu item created successfully", dto));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create menu item: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/menu/{menuItemId} - Update an existing menu item
     */
    @PutMapping("/{menuItemId}")
    public ResponseEntity<ApiResponse<MenuItemDto>> updateMenuItem(
            @PathVariable Long menuItemId,
            @RequestParam(required = false) Long ownerId,
            @RequestBody MenuItemDto request) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;

            // Verify cafe ownership
            Optional<Cafe> cafeOpt = cafeRepository.findByOwnerId(userId);
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("No cafe found for this owner"));
            }

            // Find the menu item
            Optional<MenuItem> menuItemOpt = menuItemRepository.findById(menuItemId);
            if (menuItemOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Menu item not found"));
            }

            MenuItem menuItem = menuItemOpt.get();
            
            // Verify the menu item belongs to the owner's cafe
            if (!menuItem.getCafe().getId().equals(cafeOpt.get().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("You don't have permission to update this menu item"));
            }

            // Validate input
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Item name is required"));
            }
            if (request.getPrice() == null || request.getPrice() <= 0) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Price must be greater than 0"));
            }

            // Update basic fields
            menuItem.setName(request.getName().trim());
            menuItem.setDescription(request.getDescription());
            menuItem.setPrice(request.getPrice());
            menuItem.setCategory(request.getCategory());
            menuItem.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true);

            // Handle images - clear existing and add new ones
            if (request.getImages() != null) {
                // Clear existing images
                menuItem.getImages().clear();
                
                // Add new images
                for (MenuItemImageDto imgDto : request.getImages()) {
                    if (imgDto.getFileData() == null || imgDto.getFileData().isEmpty()) continue;
                    
                    MenuItemImage img = new MenuItemImage();
                    img.setMenuItem(menuItem);
                    img.setCaption(imgDto.getCaption());
                    img.setIsPrimary(imgDto.getIsPrimary() != null ? imgDto.getIsPrimary() : false);
                    img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : 0);
                    img.setFileName(imgDto.getFileName() != null ? imgDto.getFileName() : "image");
                    img.setFileSize(imgDto.getFileSize() != null ? imgDto.getFileSize() : 0L);
                    img.setFileType(imgDto.getFileType());
                    img.setFileData(imgDto.getFileData());
                    menuItem.addImage(img);
                }
            }

            MenuItem saved = menuItemRepository.save(menuItem);

            // Log activity
            try {
                ActivityLog log = new ActivityLog();
                log.setCafe(cafeOpt.get());
                log.setType("MENU_UPDATED");
                log.setMessage("Menu item updated: " + saved.getName());
                activityLogRepository.save(log);
            } catch (Exception ignored) {}

            return ResponseEntity.ok()
                    .body(ApiResponse.success("Menu item updated successfully", toDto(saved)));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update menu item: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/menu/{menuItemId} - Delete a menu item
     */
    @DeleteMapping("/{menuItemId}")
    public ResponseEntity<ApiResponse<Void>> deleteMenuItem(
            @PathVariable Long menuItemId,
            @RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;

            // Verify cafe ownership
            Optional<Cafe> cafeOpt = cafeRepository.findByOwnerId(userId);
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("No cafe found for this owner"));
            }

            // Find the menu item
            Optional<MenuItem> menuItemOpt = menuItemRepository.findById(menuItemId);
            if (menuItemOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Menu item not found"));
            }

            MenuItem menuItem = menuItemOpt.get();
            
            // Verify the menu item belongs to the owner's cafe
            if (!menuItem.getCafe().getId().equals(cafeOpt.get().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("You don't have permission to delete this menu item"));
            }

            String itemName = menuItem.getName();

            // Delete the menu item (cascade will delete images)
            menuItemRepository.delete(menuItem);

            // Log activity
            try {
                ActivityLog log = new ActivityLog();
                log.setCafe(cafeOpt.get());
                log.setType("MENU_DELETED");
                log.setMessage("Menu item deleted: " + itemName);
                activityLogRepository.save(log);
            } catch (Exception ignored) {}

            return ResponseEntity.ok()
                    .body(ApiResponse.success("Menu item deleted successfully", null));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete menu item: " + e.getMessage()));
        }
    }

    /**
     * GET /api/menu/cafe/{cafeId}
     * Public endpoint: list available menu items for a cafe (for customers).
     */
    @GetMapping("/cafe/{cafeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenuForCafe(@PathVariable Long cafeId) {
        try {
            Optional<Cafe> cafeOpt = cafeRepository.findById(cafeId);
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cafe not found"));
            }

            Cafe cafe = cafeOpt.get();
            List<MenuItem> items = menuItemRepository.findByCafeIdAndIsAvailableTrue(cafeId);

            List<MenuItemDto> dtoList = items.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("cafeId", cafe.getId());
            response.put("cafeName", cafe.getCafeName());
            response.put("description", cafe.getDescription());
            response.put("menuItems", dtoList);

            return ResponseEntity.ok(ApiResponse.success("Cafe menu retrieved", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load cafe menu: " + e.getMessage()));
        }
    }

    /**
     * GET /api/menu/{menuItemId} - Get single menu item details
     */
    @GetMapping("/{menuItemId}")
    public ResponseEntity<ApiResponse<MenuItemDto>> getMenuItem(@PathVariable Long menuItemId) {
        try {
            Optional<MenuItem> menuItemOpt = menuItemRepository.findById(menuItemId);
            if (menuItemOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Menu item not found"));
            }

            return ResponseEntity.ok()
                    .body(ApiResponse.success("Menu item retrieved", toDto(menuItemOpt.get())));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load menu item: " + e.getMessage()));
        }
    }

    private MenuItemDto toDto(MenuItem item) {
        MenuItemDto dto = new MenuItemDto();
        dto.setId(item.getId());
        dto.setCafeId(item.getCafe() != null ? item.getCafe().getId() : null);
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setPrice(item.getPrice());
        dto.setCategory(item.getCategory());
        dto.setIsAvailable(item.getIsAvailable());
        
        // Convert images
        if (item.getImages() != null && !item.getImages().isEmpty()) {
            List<MenuItemImageDto> imageDtos = item.getImages().stream()
                .map(img -> {
                    MenuItemImageDto imgDto = new MenuItemImageDto();
                    imgDto.setId(img.getId());
                    imgDto.setCaption(img.getCaption());
                    imgDto.setIsPrimary(img.getIsPrimary());
                    imgDto.setDisplayOrder(img.getDisplayOrder());
                    imgDto.setFileName(img.getFileName());
                    imgDto.setFileSize(img.getFileSize());
                    imgDto.setFileType(img.getFileType());
                    imgDto.setFileData(img.getFileData());
                    return imgDto;
                })
                .collect(Collectors.toList());
            dto.setImages(imageDtos);
        } else {
            dto.setImages(new ArrayList<>());
        }
        
        return dto;
    }
}
